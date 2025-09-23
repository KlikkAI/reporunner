#!/bin/bash

# Reporunner Monitoring Setup Script
# This script sets up the complete Prometheus + Grafana monitoring stack

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$MONITORING_DIR/docker-compose.yml"
ENV_FILE="$MONITORING_DIR/.env"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    log "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi

    log "Dependencies check passed"
}

# Create environment file
create_env_file() {
    log "Creating environment file..."

    if [[ ! -f "$ENV_FILE" ]]; then
        cat > "$ENV_FILE" << EOF
# Grafana Configuration
GRAFANA_ADMIN_PASSWORD=admin123
GRAFANA_SECRET_KEY=$(openssl rand -base64 32)

# AlertManager Configuration
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=alerts@reporunner.com
SMTP_PASSWORD=your-smtp-password

# Slack Webhooks (replace with your actual webhook URLs)
SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/YOUR/CRITICAL/WEBHOOK
SLACK_WEBHOOK_DEV=https://hooks.slack.com/services/YOUR/DEV/WEBHOOK
SLACK_WEBHOOK_OPS=https://hooks.slack.com/services/YOUR/OPS/WEBHOOK
SLACK_WEBHOOK_SECURITY=https://hooks.slack.com/services/YOUR/SECURITY/WEBHOOK

# PagerDuty Integration
PAGERDUTY_ROUTING_KEY=your-pagerduty-integration-key

# External URLs
PROMETHEUS_EXTERNAL_URL=http://prometheus.reporunner.local:9090
ALERTMANAGER_EXTERNAL_URL=http://alerts.reporunner.local:9093
GRAFANA_EXTERNAL_URL=http://grafana.reporunner.local:3000

# Data retention
PROMETHEUS_RETENTION_TIME=15d
PROMETHEUS_RETENTION_SIZE=10GB

# Network settings
MONITORING_NETWORK=reporunner-monitoring
EOF
        log "Environment file created at $ENV_FILE"
        warn "Please update the environment variables in $ENV_FILE before starting the stack"
    else
        log "Environment file already exists"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."

    local dirs=(
        "$MONITORING_DIR/prometheus/data"
        "$MONITORING_DIR/grafana/data"
        "$MONITORING_DIR/alertmanager/data"
        "$MONITORING_DIR/grafana/dashboard-configs/system"
        "$MONITORING_DIR/grafana/dashboard-configs/application"
        "$MONITORING_DIR/grafana/dashboard-configs/business"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        # Set appropriate permissions for data directories
        if [[ "$dir" == *"/data" ]]; then
            chmod 755 "$dir"
        fi
    done

    log "Directories created successfully"
}

# Setup local DNS entries (optional)
setup_local_dns() {
    log "Setting up local DNS entries..."

    local hosts_entries=(
        "127.0.0.1 prometheus.reporunner.local"
        "127.0.0.1 grafana.reporunner.local"
        "127.0.0.1 alerts.reporunner.local"
    )

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        for entry in "${hosts_entries[@]}"; do
            if ! grep -q "$entry" /etc/hosts; then
                echo "$entry" | sudo tee -a /etc/hosts > /dev/null
            fi
        done
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        for entry in "${hosts_entries[@]}"; do
            if ! grep -q "$entry" /etc/hosts; then
                echo "$entry" | sudo tee -a /etc/hosts > /dev/null
            fi
        done
    else
        warn "Unsupported OS for automatic hosts file modification"
        warn "Please manually add these entries to your hosts file:"
        for entry in "${hosts_entries[@]}"; do
            echo "  $entry"
        done
    fi

    log "Local DNS entries configured"
}

# Download additional dashboards
download_dashboards() {
    log "Downloading additional Grafana dashboards..."

    local dashboard_dir="$MONITORING_DIR/grafana/dashboard-configs"

    # Node Exporter Full dashboard
    curl -s https://grafana.com/api/dashboards/1860/revisions/31/download | \
        jq '.dashboard' > "$dashboard_dir/system/node-exporter-full.json" || warn "Failed to download Node Exporter dashboard"

    # Docker and system monitoring dashboard
    curl -s https://grafana.com/api/dashboards/179/revisions/7/download | \
        jq '.dashboard' > "$dashboard_dir/system/docker-monitoring.json" || warn "Failed to download Docker monitoring dashboard"

    # Redis dashboard
    curl -s https://grafana.com/api/dashboards/763/revisions/4/download | \
        jq '.dashboard' > "$dashboard_dir/system/redis-dashboard.json" || warn "Failed to download Redis dashboard"

    # MongoDB dashboard
    curl -s https://grafana.com/api/dashboards/2583/revisions/2/download | \
        jq '.dashboard' > "$dashboard_dir/system/mongodb-dashboard.json" || warn "Failed to download MongoDB dashboard"

    log "Additional dashboards downloaded"
}

# Validate configuration files
validate_config() {
    log "Validating configuration files..."

    # Check Prometheus config
    if ! docker run --rm -v "$MONITORING_DIR/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml" \
        prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml; then
        error "Prometheus configuration is invalid"
    fi

    # Check AlertManager config
    if ! docker run --rm -v "$MONITORING_DIR/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml" \
        prom/alertmanager:latest amtool check-config /etc/alertmanager/alertmanager.yml; then
        error "AlertManager configuration is invalid"
    fi

    log "Configuration validation passed"
}

# Start the monitoring stack
start_stack() {
    log "Starting monitoring stack..."

    cd "$MONITORING_DIR"

    # Pull latest images
    docker-compose pull

    # Start services
    docker-compose up -d

    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30

    # Check service health
    local services=("prometheus:9090" "grafana:3000" "alertmanager:9093")

    for service in "${services[@]}"; do
        local name="${service%:*}"
        local port="${service#*:}"

        if curl -s -f "http://localhost:$port" > /dev/null; then
            log "$name is healthy"
        else
            warn "$name may not be ready yet"
        fi
    done

    log "Monitoring stack started successfully!"
}

# Print access information
print_access_info() {
    log "Monitoring stack is ready!"
    echo
    echo -e "${BLUE}Access Information:${NC}"
    echo -e "  Prometheus:   ${GREEN}http://localhost:9090${NC} or ${GREEN}http://prometheus.reporunner.local:9090${NC}"
    echo -e "  Grafana:      ${GREEN}http://localhost:3000${NC} or ${GREEN}http://grafana.reporunner.local:3000${NC}"
    echo -e "  AlertManager: ${GREEN}http://localhost:9093${NC} or ${GREEN}http://alerts.reporunner.local:9093${NC}"
    echo
    echo -e "${BLUE}Default Credentials:${NC}"
    echo -e "  Grafana: ${GREEN}admin / admin123${NC}"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Configure your Slack webhooks in ${GREEN}$ENV_FILE${NC}"
    echo -e "  2. Update SMTP settings for email alerts"
    echo -e "  3. Import additional dashboards from ${GREEN}https://grafana.com/grafana/dashboards/${NC}"
    echo -e "  4. Configure your applications to expose metrics at ${GREEN}/metrics${NC}"
    echo
}

# Stop the monitoring stack
stop_stack() {
    log "Stopping monitoring stack..."
    cd "$MONITORING_DIR"
    docker-compose down
    log "Monitoring stack stopped"
}

# Clean up (remove containers and volumes)
cleanup() {
    log "Cleaning up monitoring stack..."
    cd "$MONITORING_DIR"
    docker-compose down -v --remove-orphans
    docker system prune -f
    log "Cleanup completed"
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  setup     - Initial setup of the monitoring stack"
    echo "  start     - Start the monitoring stack"
    echo "  stop      - Stop the monitoring stack"
    echo "  restart   - Restart the monitoring stack"
    echo "  status    - Show status of monitoring services"
    echo "  logs      - Show logs from monitoring services"
    echo "  cleanup   - Remove all containers and volumes"
    echo "  validate  - Validate configuration files"
    echo
}

# Show status
show_status() {
    cd "$MONITORING_DIR"
    docker-compose ps
}

# Show logs
show_logs() {
    cd "$MONITORING_DIR"
    docker-compose logs -f "${2:-}"
}

# Main function
main() {
    case "${1:-}" in
        "setup")
            check_dependencies
            create_env_file
            create_directories
            setup_local_dns
            download_dashboards
            validate_config
            start_stack
            print_access_info
            ;;
        "start")
            cd "$MONITORING_DIR"
            docker-compose up -d
            print_access_info
            ;;
        "stop")
            stop_stack
            ;;
        "restart")
            stop_stack
            sleep 5
            cd "$MONITORING_DIR"
            docker-compose up -d
            print_access_info
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$@"
            ;;
        "cleanup")
            cleanup
            ;;
        "validate")
            validate_config
            ;;
        "help"|"-h"|"--help")
            usage
            ;;
        *)
            error "Unknown command: ${1:-}. Use 'help' for usage information."
            ;;
    esac
}

# Run main function with all arguments
main "$@"