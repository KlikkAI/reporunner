#!/bin/bash
# ============================================
# KlikkFlow - Blue-Green Deployment Script
# ============================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
ENVIRONMENT=""
REGISTRY="klikkflow"
SKIP_HEALTH_CHECK="false"
DEPLOYMENT_DIR="/opt/klikkflow"

#======================================
# Parse Arguments
#======================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --environment) ENVIRONMENT="$2"; shift 2 ;;
        --registry) REGISTRY="$2"; shift 2 ;;
        --skip-health-check) SKIP_HEALTH_CHECK="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$ENVIRONMENT" ]; then
    echo "Error: --environment is required (blue or green)"
    exit 1
fi

echo -e "${BLUE}Starting deployment to $ENVIRONMENT environment...${NC}"

#======================================
# Pull Latest Images
#======================================

echo "🐳 Pulling latest images from $REGISTRY..."
docker pull "$REGISTRY/frontend:latest"
docker pull "$REGISTRY/backend:latest"
docker pull "$REGISTRY/worker:latest"
echo -e "${GREEN}✓ Images pulled${NC}"

#======================================
# Start New Environment
#======================================

echo "🚀 Starting $ENVIRONMENT environment..."
cd "$DEPLOYMENT_DIR"

# Ensure .env file exists
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "Error: .env.$ENVIRONMENT not found"
    exit 1
fi

# Start containers
docker-compose -f "docker-compose.$ENVIRONMENT.yml" up -d

echo -e "${GREEN}✓ $ENVIRONMENT environment started${NC}"

#======================================
# Wait for Health
#======================================

if [ "$SKIP_HEALTH_CHECK" != "true" ]; then
    echo "⏳ Waiting for containers to be healthy..."
    sleep 15

    # Check container health
    FRONTEND_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' "klikkflow-frontend-$ENVIRONMENT" || echo "unknown")
    BACKEND_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' "klikkflow-backend-$ENVIRONMENT" || echo "unknown")

    if [ "$FRONTEND_HEALTHY" = "healthy" ] && [ "$BACKEND_HEALTHY" = "healthy" ]; then
        echo -e "${GREEN}✓ All containers healthy${NC}"
    else
        echo -e "${RED}Warning: Some containers may not be fully healthy yet${NC}"
        echo "Frontend: $FRONTEND_HEALTHY, Backend: $BACKEND_HEALTHY"
    fi
fi

echo -e "${GREEN}✓ Deployment to $ENVIRONMENT complete${NC}"
