#!/bin/bash
# ============================================
# KlikkFlow - Health Check Script
# ============================================

set -euo pipefail

FRONTEND_PORT=3010
BACKEND_PORT=3011
MAX_RETRIES=10
RETRY_DELAY=3

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
        --backend-port) BACKEND_PORT="$2"; shift 2 ;;
        *) shift ;;
    esac
done

echo "🏥 Running health checks..."

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local retries=0

    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s -o /dev/null "http://localhost:$url"; then
            echo "✓ $name is healthy"
            return 0
        fi
        retries=$((retries + 1))
        echo "⏳ Waiting for $name... (attempt $retries/$MAX_RETRIES)"
        sleep $RETRY_DELAY
    done

    echo "✗ $name health check failed"
    return 1
}

# Check frontend
check_endpoint "$FRONTEND_PORT/health" "Frontend"
FRONTEND_OK=$?

# Check backend
check_endpoint "$BACKEND_PORT/health" "Backend API"
BACKEND_OK=$?

# Overall result
if [ $FRONTEND_OK -eq 0 ] && [ $BACKEND_OK -eq 0 ]; then
    echo "✅ All health checks passed"
    exit 0
else
    echo "❌ Health checks failed"
    exit 1
fi
