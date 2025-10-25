#!/bin/bash
# ============================================
# KlikkFlow - Rollback Script
# ============================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT=""
NGINX_CONFIG="/etc/nginx/sites-available/klikkflow"

while [[ $# -gt 0 ]]; do
    case $1 in
        --environment) ENVIRONMENT="$2"; shift 2 ;;
        *) shift ;;
    esac
done

if [ -z "$ENVIRONMENT" ]; then
    echo "Error: --environment is required"
    exit 1
fi

echo -e "${RED}🔄 Rolling back to $ENVIRONMENT environment...${NC}"

# Determine port based on environment
if [ "$ENVIRONMENT" = "blue" ]; then
    NEW_PORT=3010
    OLD_PORT=3020
else
    NEW_PORT=3020
    OLD_PORT=3010
fi

# Switch Nginx
sudo sed -i "s/server localhost:$OLD_PORT;/# server localhost:$OLD_PORT;/" "$NGINX_CONFIG"
sudo sed -i "s/# server localhost:$NEW_PORT;/server localhost:$NEW_PORT;/" "$NGINX_CONFIG"

# Also update backend port
sudo sed -i "s/set \$backend_port [0-9]\+;/set \$backend_port $((NEW_PORT + 1));/" "$NGINX_CONFIG"

# Reload Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Rolled back to $ENVIRONMENT${NC}"
else
    echo -e "${RED}✗ Nginx config test failed${NC}"
    exit 1
fi
