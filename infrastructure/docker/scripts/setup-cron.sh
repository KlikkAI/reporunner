#!/bin/bash
# ============================================
# Reporunner Backup Cron Setup Script
# Configures automated backup scheduling
# ============================================

set -euo pipefail

# ==========================================
# Configuration
# ==========================================

BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"  # Default: 2 AM daily
LOG_FILE="${LOG_FILE:-/backups/backup.log}"

# ==========================================
# Logging
# ==========================================

log_info() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $*"
}

log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS] $*"
}

# ==========================================
# Environment Variables Export
# ==========================================

# Create environment file for cron (cron doesn't inherit environment)
cat > /tmp/backup-env << EOF
MONGO_URI="${MONGO_URI}"
POSTGRES_URI="${POSTGRES_URI}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_REGION="${S3_REGION:-us-east-1}"
LOG_LEVEL="${LOG_LEVEL:-info}"
TZ="${TZ:-UTC}"
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
EOF

# ==========================================
# Create Cron Job
# ==========================================

log_info "Setting up backup cron job with schedule: ${BACKUP_SCHEDULE}"

# Create cron wrapper script that sources environment
cat > /tmp/backup-cron-wrapper.sh << 'EOF'
#!/bin/bash
# Load environment variables
set -a
source /tmp/backup-env
set +a

# Run backup script with logging
/app/backup.sh >> /backups/backup.log 2>&1
EOF

chmod +x /tmp/backup-cron-wrapper.sh

# Create crontab
echo "${BACKUP_SCHEDULE} /tmp/backup-cron-wrapper.sh" > /tmp/crontab

# Install crontab (as root for dcron)
# Note: Alpine dcron requires crontab in specific location
mkdir -p /var/spool/cron/crontabs
cat /tmp/crontab > /var/spool/cron/crontabs/backup

log_success "Cron job configured: ${BACKUP_SCHEDULE}"

# ==========================================
# Run Initial Backup
# ==========================================

log_info "Running initial backup..."
if /app/backup.sh >> "${LOG_FILE}" 2>&1; then
    log_success "Initial backup completed"
else
    log_info "Initial backup failed (this is normal on first run if databases are empty)"
fi

# ==========================================
# Start Cron Daemon
# ==========================================

log_info "Starting cron daemon..."
log_info "Backup logs: ${LOG_FILE}"
log_info "Schedule: ${BACKUP_SCHEDULE}"
log_info "Retention: ${BACKUP_RETENTION_DAYS} days"
log_info "========================================"
log_success "Backup service started successfully"
log_info "Next backup will run according to schedule: ${BACKUP_SCHEDULE}"
log_info "Use 'docker logs -f reporunner-backup' to monitor backups"
log_info "========================================"

# Start crond in foreground
exec crond -f -l 2
