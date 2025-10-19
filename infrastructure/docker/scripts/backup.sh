#!/bin/bash
# ============================================
# Reporunner Backup Script
# Automated MongoDB + PostgreSQL backups
# Supports: Local storage + S3 upload
# ============================================

set -euo pipefail

# ==========================================
# Configuration
# ==========================================

# Required environment variables
MONGO_URI="${MONGO_URI:-mongodb://mongo:27017}"
POSTGRES_URI="${POSTGRES_URI:-postgresql://postgres:reporunner_dev_password@postgres:5432/reporunner}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Optional S3 configuration
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_REGION="${S3_REGION:-us-east-1}"

# Timestamp for backup files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_DIR=$(date +%Y-%m-%d)

# ==========================================
# Logging Functions
# ==========================================

log_info() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $*"
}

log_warn() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [WARN] $*" >&2
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $*"
}

# ==========================================
# Health Check File
# ==========================================

update_health() {
    echo "last_backup=$(date -Iseconds)" > /tmp/backup-health
}

# ==========================================
# MongoDB Backup Function
# ==========================================

backup_mongodb() {
    local mongo_backup_dir="${BACKUP_DIR}/mongodb/${DATE_DIR}"
    local mongo_backup_file="mongodb_${TIMESTAMP}.gz"

    log_info "Starting MongoDB backup..."

    # Create backup directory
    mkdir -p "${mongo_backup_dir}"

    # Perform MongoDB dump
    if mongodump --uri="${MONGO_URI}" \
        --gzip \
        --archive="${mongo_backup_dir}/${mongo_backup_file}" \
        --quiet; then

        local backup_size=$(du -h "${mongo_backup_dir}/${mongo_backup_file}" | cut -f1)
        log_success "MongoDB backup completed: ${mongo_backup_file} (${backup_size})"

        # Upload to S3 if configured
        if [ -n "${S3_BUCKET}" ]; then
            upload_to_s3 "${mongo_backup_dir}/${mongo_backup_file}" "mongodb/${DATE_DIR}/${mongo_backup_file}"
        fi

        return 0
    else
        log_error "MongoDB backup failed"
        return 1
    fi
}

# ==========================================
# PostgreSQL Backup Function
# ==========================================

backup_postgresql() {
    local pg_backup_dir="${BACKUP_DIR}/postgresql/${DATE_DIR}"
    local pg_backup_file="postgresql_${TIMESTAMP}.sql.gz"

    log_info "Starting PostgreSQL backup..."

    # Create backup directory
    mkdir -p "${pg_backup_dir}"

    # Perform PostgreSQL dump
    if pg_dump "${POSTGRES_URI}" \
        --format=custom \
        --compress=9 \
        --file="${pg_backup_dir}/${pg_backup_file}"; then

        local backup_size=$(du -h "${pg_backup_dir}/${pg_backup_file}" | cut -f1)
        log_success "PostgreSQL backup completed: ${pg_backup_file} (${backup_size})"

        # Upload to S3 if configured
        if [ -n "${S3_BUCKET}" ]; then
            upload_to_s3 "${pg_backup_dir}/${pg_backup_file}" "postgresql/${DATE_DIR}/${pg_backup_file}"
        fi

        return 0
    else
        log_error "PostgreSQL backup failed"
        return 1
    fi
}

# ==========================================
# S3 Upload Function
# ==========================================

upload_to_s3() {
    local local_file="$1"
    local s3_path="$2"

    log_info "Uploading to S3: s3://${S3_BUCKET}/${s3_path}"

    local aws_args=(
        "s3" "cp"
        "${local_file}"
        "s3://${S3_BUCKET}/${s3_path}"
    )

    # Add endpoint if specified (for S3-compatible services like MinIO)
    if [ -n "${S3_ENDPOINT}" ]; then
        aws_args+=("--endpoint-url" "${S3_ENDPOINT}")
    fi

    # Add region
    aws_args+=("--region" "${S3_REGION}")

    if aws "${aws_args[@]}"; then
        log_success "S3 upload completed: ${s3_path}"
        return 0
    else
        log_error "S3 upload failed: ${s3_path}"
        return 1
    fi
}

# ==========================================
# Cleanup Old Backups
# ==========================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."

    local deleted_count=0

    # Clean MongoDB backups
    if [ -d "${BACKUP_DIR}/mongodb" ]; then
        deleted_count=$(find "${BACKUP_DIR}/mongodb" -type f -name "*.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete -print | wc -l)
        if [ ${deleted_count} -gt 0 ]; then
            log_info "Deleted ${deleted_count} old MongoDB backup(s)"
        fi
    fi

    # Clean PostgreSQL backups
    if [ -d "${BACKUP_DIR}/postgresql" ]; then
        deleted_count=$(find "${BACKUP_DIR}/postgresql" -type f -name "*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS} -delete -print | wc -l)
        if [ ${deleted_count} -gt 0 ]; then
            log_info "Deleted ${deleted_count} old PostgreSQL backup(s)"
        fi
    fi

    # Clean empty directories
    find "${BACKUP_DIR}" -type d -empty -delete 2>/dev/null || true

    log_success "Cleanup completed"
}

# ==========================================
# Backup Verification
# ==========================================

verify_backup() {
    local backup_file="$1"

    # Check if file exists
    if [ ! -f "${backup_file}" ]; then
        log_error "Backup file does not exist: ${backup_file}"
        return 1
    fi

    # Check if file is not empty
    if [ ! -s "${backup_file}" ]; then
        log_error "Backup file is empty: ${backup_file}"
        return 1
    fi

    # Check file size (minimum 1KB)
    local file_size=$(stat -c%s "${backup_file}")
    if [ ${file_size} -lt 1024 ]; then
        log_warn "Backup file is very small (${file_size} bytes): ${backup_file}"
    fi

    log_info "Backup verification passed: ${backup_file}"
    return 0
}

# ==========================================
# Disk Space Check
# ==========================================

check_disk_space() {
    local required_space_mb=500  # Require at least 500MB free
    local available_space=$(df -m "${BACKUP_DIR}" | tail -1 | awk '{print $4}')

    if [ ${available_space} -lt ${required_space_mb} ]; then
        log_error "Insufficient disk space: ${available_space}MB available, ${required_space_mb}MB required"
        return 1
    fi

    log_info "Disk space check passed: ${available_space}MB available"
    return 0
}

# ==========================================
# Generate Backup Report
# ==========================================

generate_report() {
    local mongo_success=$1
    local pg_success=$2

    local report_file="${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt"

    {
        echo "======================================"
        echo "Reporunner Backup Report"
        echo "======================================"
        echo "Timestamp: $(date -Iseconds)"
        echo "Backup Directory: ${BACKUP_DIR}"
        echo ""
        echo "MongoDB Backup: $([ ${mongo_success} -eq 0 ] && echo "SUCCESS" || echo "FAILED")"
        echo "PostgreSQL Backup: $([ ${pg_success} -eq 0 ] && echo "SUCCESS" || echo "FAILED")"
        echo ""
        echo "Disk Usage:"
        du -sh "${BACKUP_DIR}" 2>/dev/null || echo "N/A"
        echo ""
        echo "Recent Backups:"
        echo "MongoDB:"
        find "${BACKUP_DIR}/mongodb" -type f -name "*.gz" -mtime -1 -exec ls -lh {} \; 2>/dev/null | tail -5 || echo "None"
        echo ""
        echo "PostgreSQL:"
        find "${BACKUP_DIR}/postgresql" -type f -name "*.sql.gz" -mtime -1 -exec ls -lh {} \; 2>/dev/null | tail -5 || echo "None"
        echo ""
        echo "======================================"
    } > "${report_file}"

    # Print report to stdout
    cat "${report_file}"

    # Upload report to S3 if configured
    if [ -n "${S3_BUCKET}" ]; then
        upload_to_s3 "${report_file}" "reports/backup_report_${TIMESTAMP}.txt"
    fi
}

# ==========================================
# Main Backup Function
# ==========================================

main() {
    log_info "========================================"
    log_info "Reporunner Backup Service Starting"
    log_info "========================================"
    log_info "Timestamp: $(date -Iseconds)"
    log_info "MongoDB URI: ${MONGO_URI%%@*}@***"  # Hide password
    log_info "PostgreSQL URI: ${POSTGRES_URI%%@*}@***"  # Hide password
    log_info "Backup Directory: ${BACKUP_DIR}"
    log_info "Retention: ${BACKUP_RETENTION_DAYS} days"

    if [ -n "${S3_BUCKET}" ]; then
        log_info "S3 Bucket: ${S3_BUCKET}"
        [ -n "${S3_ENDPOINT}" ] && log_info "S3 Endpoint: ${S3_ENDPOINT}"
    else
        log_info "S3 upload: Disabled"
    fi

    log_info "========================================"

    # Check disk space
    if ! check_disk_space; then
        log_error "Backup aborted due to insufficient disk space"
        exit 1
    fi

    # Track backup status
    local mongo_status=1
    local pg_status=1

    # Perform MongoDB backup
    if backup_mongodb; then
        mongo_status=0
    fi

    # Perform PostgreSQL backup
    if backup_postgresql; then
        pg_status=0
    fi

    # Cleanup old backups
    cleanup_old_backups

    # Generate backup report
    generate_report ${mongo_status} ${pg_status}

    # Update health check file
    update_health

    # Final status
    log_info "========================================"
    if [ ${mongo_status} -eq 0 ] && [ ${pg_status} -eq 0 ]; then
        log_success "All backups completed successfully"
        exit 0
    elif [ ${mongo_status} -eq 0 ] || [ ${pg_status} -eq 0 ]; then
        log_warn "Some backups failed (MongoDB: $([ ${mongo_status} -eq 0 ] && echo "OK" || echo "FAIL"), PostgreSQL: $([ ${pg_status} -eq 0 ] && echo "OK" || echo "FAIL"))"
        exit 1
    else
        log_error "All backups failed"
        exit 2
    fi
}

# ==========================================
# Entry Point
# ==========================================

# Handle signals for graceful shutdown
trap 'log_info "Received shutdown signal, exiting..."; exit 0' SIGTERM SIGINT

# Run main function
main "$@"
