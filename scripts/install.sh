#!/bin/bash

# ============================================
# KlikkFlow One-Command Installer
# ============================================
#
# Quick Start:
#   curl -fsSL https://get.klikkflow.io/install.sh | sh
#
# Manual Install:
#   wget https://get.klikkflow.io/install.sh
#   chmod +x install.sh
#   ./install.sh
#
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE_URL="https://raw.githubusercontent.com/KlikkAI/klikkflow/main/docker-compose.simple.yml"
INSTALL_DIR="${KLIKKFLOW_INSTALL_DIR:-$HOME/.klikkflow}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-3001}"

# ============================================
# Helper Functions
# ============================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                            ║${NC}"
    echo -e "${CYAN}║          ${GREEN}KlikkFlow Installer${CYAN}             ║${NC}"
    echo -e "${CYAN}║                                            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# ============================================
# Prerequisite Checks
# ============================================

check_docker() {
    print_step "Checking Docker installation..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo ""
        echo "Please install Docker first:"
        echo "  • macOS/Windows: https://www.docker.com/products/docker-desktop"
        echo "  • Linux: https://docs.docker.com/engine/install/"
        echo ""
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        echo ""
        echo "Please start Docker and try again"
        exit 1
    fi

    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    print_success "Docker $DOCKER_VERSION found"
}

check_docker_compose() {
    print_step "Checking Docker Compose installation..."

    # Check for docker compose (v2) or docker-compose (v1)
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        COMPOSE_VERSION=$(docker compose version --short)
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        COMPOSE_VERSION=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    else
        print_error "Docker Compose is not installed"
        echo ""
        echo "Docker Compose is usually included with Docker Desktop."
        echo "For standalone installation: https://docs.docker.com/compose/install/"
        echo ""
        exit 1
    fi

    print_success "Docker Compose $COMPOSE_VERSION found"
}

check_ports() {
    print_step "Checking required ports..."

    PORTS_IN_USE=()

    # Check frontend port
    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":$FRONTEND_PORT.*LISTEN"; then
        PORTS_IN_USE+=("$FRONTEND_PORT (Frontend)")
    fi

    # Check backend port
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep -q ":$BACKEND_PORT.*LISTEN"; then
        PORTS_IN_USE+=("$BACKEND_PORT (Backend)")
    fi

    if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
        print_warning "The following ports are already in use:"
        for port in "${PORTS_IN_USE[@]}"; do
            echo "  • $port"
        done
        echo ""
        echo "Options:"
        echo "  1. Stop the services using these ports"
        echo "  2. Set custom ports: FRONTEND_PORT=3001 BACKEND_PORT=3002 ./install.sh"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Ports $FRONTEND_PORT and $BACKEND_PORT are available"
    fi
}

# ============================================
# Installation Functions
# ============================================

create_install_directory() {
    print_step "Creating installation directory..."

    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    print_success "Created directory: $INSTALL_DIR"
}

download_docker_compose() {
    print_step "Downloading docker-compose.simple.yml..."

    if command -v curl &> /dev/null; then
        curl -fsSL "$COMPOSE_FILE_URL" -o docker-compose.yml
    elif command -v wget &> /dev/null; then
        wget -q "$COMPOSE_FILE_URL" -O docker-compose.yml
    else
        print_error "Neither curl nor wget is available"
        echo "Please install curl or wget and try again"
        exit 1
    fi

    if [ ! -f docker-compose.yml ]; then
        print_error "Failed to download docker-compose.yml"
        exit 1
    fi

    print_success "Downloaded docker-compose.yml"
}

generate_secrets() {
    print_step "Generating secure secrets..."

    # Generate JWT_SECRET (32-byte base64)
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        ENCRYPTION_KEY=$(openssl rand -base64 32)
    else
        # Fallback to /dev/urandom
        JWT_SECRET=$(head -c 32 /dev/urandom | base64)
        ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)
    fi

    print_success "Generated JWT_SECRET and ENCRYPTION_KEY"
}

create_env_file() {
    print_step "Creating .env file..."

    cat > .env << EOF
# ============================================
# KlikkFlow Configuration
# Generated: $(date)
# ============================================

# Application Ports
FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}

# Security (Auto-generated - DO NOT SHARE)
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Database Configuration
POSTGRES_PASSWORD=klikkflow_pg_2024

# API URLs (Auto-configured)
VITE_API_URL=http://localhost:${BACKEND_PORT}
VITE_WS_URL=ws://localhost:${BACKEND_PORT}

# Logging
LOG_LEVEL=info

# Optional: AI Services (Add your API keys here)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# GOOGLE_AI_API_KEY=

# Optional: Email Configuration
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=noreply@klikkflow.local
EOF

    chmod 600 .env  # Secure permissions
    print_success "Created .env file with secure permissions"
}

start_services() {
    print_step "Starting KlikkFlow services..."

    echo ""
    echo "This will download and start 6 containers:"
    echo "  • Frontend (React Application)"
    echo "  • Backend (API Server)"
    echo "  • Worker (Background Job Processor)"
    echo "  • MongoDB (Primary Database)"
    echo "  • PostgreSQL (AI Database with pgvector)"
    echo "  • Redis (Cache & Queue)"
    echo ""

    # Pull images first to show progress
    print_info "Pulling Docker images (this may take a few minutes on first run)..."
    $COMPOSE_CMD pull

    # Start services
    print_info "Starting services..."
    $COMPOSE_CMD up -d

    print_success "Services started successfully"
}

wait_for_services() {
    print_step "Waiting for services to become healthy..."

    MAX_WAIT=120  # Maximum wait time in seconds
    ELAPSED=0
    INTERVAL=5

    echo ""

    while [ $ELAPSED -lt $MAX_WAIT ]; do
        # Check if backend is responding
        if curl -f -s "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
            print_success "All services are healthy!"
            return 0
        fi

        echo -ne "\r${YELLOW}⏳${NC} Waiting for services... ${ELAPSED}s / ${MAX_WAIT}s"
        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
    done

    echo ""
    print_warning "Services did not become healthy within ${MAX_WAIT}s"
    print_info "This might be normal on first startup. Check logs with: cd $INSTALL_DIR && $COMPOSE_CMD logs"
}

# ============================================
# Post-Installation
# ============================================

print_success_message() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}║     ✓ KlikkFlow Installed Successfully   ║${NC}"
    echo -e "${GREEN}║                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}🚀 Quick Start:${NC}"
    echo ""
    echo -e "  ${GREEN}1.${NC} Open your browser:"
    echo -e "     ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
    echo ""
    echo -e "  ${GREEN}2.${NC} Default credentials:"
    echo -e "     Email:    ${YELLOW}admin@klikkflow.local${NC}"
    echo -e "     Password: ${YELLOW}admin123${NC}"
    echo ""

    echo -e "${CYAN}📋 Useful Commands:${NC}"
    echo ""
    echo -e "  View logs:        ${YELLOW}cd $INSTALL_DIR && $COMPOSE_CMD logs -f${NC}"
    echo -e "  Stop services:    ${YELLOW}cd $INSTALL_DIR && $COMPOSE_CMD stop${NC}"
    echo -e "  Start services:   ${YELLOW}cd $INSTALL_DIR && $COMPOSE_CMD start${NC}"
    echo -e "  Restart services: ${YELLOW}cd $INSTALL_DIR && $COMPOSE_CMD restart${NC}"
    echo -e "  Uninstall:        ${YELLOW}cd $INSTALL_DIR && $COMPOSE_CMD down -v${NC}"
    echo ""

    echo -e "${CYAN}📚 Documentation:${NC}"
    echo ""
    echo -e "  • Getting Started: ${BLUE}https://docs.klikkflow.io/getting-started${NC}"
    echo -e "  • Integrations:    ${BLUE}https://docs.klikkflow.io/integrations${NC}"
    echo -e "  • GitHub:          ${BLUE}https://github.com/KlikkAI/klikkflow${NC}"
    echo ""

    echo -e "${CYAN}💡 Next Steps:${NC}"
    echo ""
    echo "  • Configure AI services (add API keys to .env)"
    echo "  • Set up email notifications (SMTP settings)"
    echo "  • Explore available integrations"
    echo "  • Create your first workflow!"
    echo ""

    print_info "Installation directory: $INSTALL_DIR"
    echo ""
}

cleanup_on_error() {
    print_error "Installation failed"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check Docker is running: docker info"
    echo "  • Check logs: cd $INSTALL_DIR && $COMPOSE_CMD logs"
    echo "  • Report issues: https://github.com/KlikkAI/klikkflow/issues"
    echo ""
    exit 1
}

# ============================================
# Main Installation Flow
# ============================================

main() {
    # Set error handler
    trap cleanup_on_error ERR

    print_header

    # Prerequisite checks
    check_docker
    check_docker_compose
    check_ports

    echo ""

    # Installation
    create_install_directory
    download_docker_compose
    generate_secrets
    create_env_file
    start_services
    wait_for_services

    # Success
    print_success_message
}

# Run main function
main "$@"
