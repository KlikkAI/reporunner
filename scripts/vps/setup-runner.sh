#!/bin/bash
# ============================================
# KlikkFlow - GitHub Actions Self-Hosted Runner Setup
# ============================================
#
# This script installs and configures a GitHub Actions
# self-hosted runner on your VPS for automated deployments.
#
# Usage:
#   sudo ./setup-runner.sh --token YOUR_GITHUB_TOKEN --repo KlikkAI/klikkflow
#
# Prerequisites:
#   - Ubuntu 20.04+ or Debian 11+
#   - Docker installed
#   - Nginx installed
#   - Sudo access
#
# ============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RUNNER_NAME="klikkflow-vps-runner"
RUNNER_LABELS="self-hosted,vps,production"
RUNNER_WORK_DIR="/opt/klikkflow"
RUNNER_USER="klikkflow"
REPO=""
TOKEN=""

#======================================
# Helper Functions
#======================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

#======================================
# Parse Arguments
#======================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --token)
            TOKEN="$2"
            shift 2
            ;;
        --repo)
            REPO="$2"
            shift 2
            ;;
        --name)
            RUNNER_NAME="$2"
            shift 2
            ;;
        --work-dir)
            RUNNER_WORK_DIR="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

#======================================
# Validation
#======================================

if [ -z "$TOKEN" ] || [ -z "$REPO" ]; then
    log_error "Missing required arguments"
    echo "Usage: sudo ./setup-runner.sh --token YOUR_GITHUB_TOKEN --repo OWNER/REPO"
    echo ""
    echo "Get your token from: https://github.com/$REPO/settings/actions/runners/new"
    exit 1
fi

check_root

log_info "Setting up GitHub Actions self-hosted runner..."
log_info "Repository: $REPO"
log_info "Runner name: $RUNNER_NAME"
log_info "Work directory: $RUNNER_WORK_DIR"

#======================================
# Create Runner User
#======================================

log_info "Creating runner user..."

if id "$RUNNER_USER" &>/dev/null; then
    log_warn "User $RUNNER_USER already exists"
else
    useradd -m -s /bin/bash "$RUNNER_USER"
    usermod -aG docker "$RUNNER_USER"
    log_success "User $RUNNER_USER created"
fi

#======================================
# Create Work Directory
#======================================

log_info "Creating work directory..."

mkdir -p "$RUNNER_WORK_DIR"
mkdir -p "$RUNNER_WORK_DIR/scripts/vps"
mkdir -p "$RUNNER_WORK_DIR/backups"
chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_WORK_DIR"

log_success "Work directory created at $RUNNER_WORK_DIR"

#======================================
# Install Runner
#======================================

log_info "Downloading GitHub Actions runner..."

RUNNER_DIR="/home/$RUNNER_USER/actions-runner"
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Get latest runner version
RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | grep 'tag_name' | cut -d\" -f4 | sed 's/v//')

# Download runner
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

# Extract
tar xzf "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
rm "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"

log_success "Runner downloaded (version $RUNNER_VERSION)"

#======================================
# Configure Runner
#======================================

log_info "Configuring runner..."

su - "$RUNNER_USER" << EOF
cd "$RUNNER_DIR"
./config.sh \
    --url "https://github.com/$REPO" \
    --token "$TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --work "$RUNNER_WORK_DIR" \
    --unattended \
    --replace
EOF

log_success "Runner configured"

#======================================
# Install as Service
#======================================

log_info "Installing runner as systemd service..."

cd "$RUNNER_DIR"
./svc.sh install "$RUNNER_USER"
./svc.sh start

log_success "Runner service installed and started"

#======================================
# Security Hardening
#======================================

log_info "Applying security hardening..."

# Limit runner user permissions
chmod 750 "$RUNNER_DIR"
chmod 750 "$RUNNER_WORK_DIR"

# Configure sudo for deployments (read-only nginx operations)
cat > /etc/sudoers.d/klikkflow-runner << 'SUDOERS'
# Allow runner to reload nginx and test config
klikkflow ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
klikkflow ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
klikkflow ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
SUDOERS

chmod 440 /etc/sudoers.d/klikkflow-runner

log_success "Security hardening applied"

#======================================
# Firewall Configuration
#======================================

log_info "Configuring firewall..."

if command -v ufw &> /dev/null; then
    # Allow SSH, HTTP, HTTPS
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'

    # Deny outbound except for specific ports (if needed)
    # ufw default deny outgoing
    # ufw allow out 80/tcp
    # ufw allow out 443/tcp

    log_success "Firewall configured"
else
    log_warn "UFW not installed, skipping firewall configuration"
fi

#======================================
# Create Helper Scripts
#======================================

log_info "Creating helper scripts..."

# Runner status check script
cat > /usr/local/bin/klikkflow-runner-status << 'STATUS_SCRIPT'
#!/bin/bash
systemctl status actions.runner.*.service
STATUS_SCRIPT

chmod +x /usr/local/bin/klikkflow-runner-status

# Runner logs script
cat > /usr/local/bin/klikkflow-runner-logs << 'LOGS_SCRIPT'
#!/bin/bash
journalctl -u actions.runner.*.service -f
LOGS_SCRIPT

chmod +x /usr/local/bin/klikkflow-runner-logs

log_success "Helper scripts created"

#======================================
# Final Setup
#======================================

log_info "Performing final setup..."

# Create initial networks and volumes for Docker
su - "$RUNNER_USER" << 'EOF'
docker network create klikkflow-network 2>/dev/null || true
docker volume create klikkflow_mongo_data 2>/dev/null || true
docker volume create klikkflow_postgres_data 2>/dev/null || true
docker volume create klikkflow_redis_data 2>/dev/null || true
docker volume create klikkflow_uploads 2>/dev/null || true
EOF

log_success "Docker networks and volumes created"

#======================================
# Summary
#======================================

echo ""
echo "=========================================="
log_success "GitHub Actions Runner Setup Complete!"
echo "=========================================="
echo ""
echo "Runner Details:"
echo "  - Name: $RUNNER_NAME"
echo "  - User: $RUNNER_USER"
echo "  - Work Directory: $RUNNER_WORK_DIR"
echo "  - Status: $(systemctl is-active actions.runner.*.service)"
echo ""
echo "Useful Commands:"
echo "  - Check status: klikkflow-runner-status"
echo "  - View logs: klikkflow-runner-logs"
echo "  - Restart runner: sudo systemctl restart actions.runner.*.service"
echo ""
echo "Next Steps:"
echo "  1. Verify runner appears in GitHub:"
echo "     https://github.com/$REPO/settings/actions/runners"
echo ""
echo "  2. Configure GitHub Secrets (see docs/deployment/VPS_SETUP.md)"
echo ""
echo "  3. Deploy infrastructure services:"
echo "     cd $RUNNER_WORK_DIR && docker-compose up -d"
echo ""
echo "  4. Push to main branch to trigger first deployment"
echo ""
echo "=========================================="
