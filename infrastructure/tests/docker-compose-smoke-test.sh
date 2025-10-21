#!/bin/bash

# Docker Compose Smoke Test
# Tests all docker-compose configurations for validity and basic functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Docker Compose Smoke Tests"
echo "========================================="

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Validate docker-compose.dev.yml
echo -e "\n${YELLOW}Testing docker-compose.dev.yml...${NC}"
if docker compose -f "$INFRA_DIR/../docker-compose.dev.yml" config > /dev/null 2>&1; then
    print_result 0 "docker-compose.dev.yml is valid"
else
    print_result 1 "docker-compose.dev.yml validation failed"
fi

# Test 2: Validate docker-compose.prod.yml
echo -e "\n${YELLOW}Testing docker/docker-compose.prod.yml...${NC}"
if docker compose -f "$INFRA_DIR/docker/docker-compose.prod.yml" config > /dev/null 2>&1; then
    print_result 0 "docker-compose.prod.yml is valid"
else
    print_result 1 "docker-compose.prod.yml validation failed"
fi

# Test 3: Validate docker-compose.monitoring.yml
echo -e "\n${YELLOW}Testing docker/docker-compose.monitoring.yml...${NC}"
if docker compose -f "$INFRA_DIR/docker/docker-compose.monitoring.yml" config > /dev/null 2>&1; then
    print_result 0 "docker-compose.monitoring.yml is valid"
else
    print_result 1 "docker-compose.monitoring.yml validation failed"
fi

# Test 4: Validate standard docker-compose.yml
echo -e "\n${YELLOW}Testing docker/docker-compose.yml...${NC}"
if docker compose -f "$INFRA_DIR/docker/docker-compose.yml" config > /dev/null 2>&1; then
    print_result 0 "docker-compose.yml is valid"
else
    print_result 1 "docker-compose.yml validation failed"
fi

# Test 5: Check Dockerfile syntax
echo -e "\n${YELLOW}Testing Dockerfile...${NC}"
if docker build -f "$INFRA_DIR/../Dockerfile" --target builder -t klikkflow-test:builder "$INFRA_DIR/.." > /dev/null 2>&1; then
    print_result 0 "Dockerfile multi-stage build is valid"
    docker rmi klikkflow-test:builder > /dev/null 2>&1 || true
else
    print_result 1 "Dockerfile build failed"
fi

# Test 6: Check Dockerfile.dev syntax
echo -e "\n${YELLOW}Testing Dockerfile.dev...${NC}"
if docker build -f "$INFRA_DIR/../Dockerfile.dev" -t klikkflow-test:dev "$INFRA_DIR/.." > /dev/null 2>&1; then
    print_result 0 "Dockerfile.dev build is valid"
    docker rmi klikkflow-test:dev > /dev/null 2>&1 || true
else
    print_result 1 "Dockerfile.dev build failed"
fi

# Test 7: Verify required environment variables are documented
echo -e "\n${YELLOW}Testing environment variable documentation...${NC}"
REQUIRED_VARS=("MONGODB_URI" "POSTGRES_URI" "REDIS_URL" "JWT_SECRET")
ENV_DOC_MISSING=0

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "$var" "$INFRA_DIR/docker/docker-compose.prod.yml"; then
        echo -e "${RED}  - Missing $var in production compose${NC}"
        ENV_DOC_MISSING=1
    fi
done

if [ $ENV_DOC_MISSING -eq 0 ]; then
    print_result 0 "All required environment variables documented"
else
    print_result 1 "Some environment variables not documented"
fi

# Test 8: Check health check configurations
echo -e "\n${YELLOW}Testing health check configurations...${NC}"
HEALTHCHECKS=$(docker compose -f "$INFRA_DIR/docker/docker-compose.prod.yml" config | grep -c "healthcheck:" || true)
if [ "$HEALTHCHECKS" -gt 0 ]; then
    print_result 0 "Health checks configured (found $HEALTHCHECKS services)"
else
    print_result 1 "No health checks found in production compose"
fi

# Test 9: Verify network isolation
echo -e "\n${YELLOW}Testing network isolation...${NC}"
NETWORKS=$(docker compose -f "$INFRA_DIR/docker/docker-compose.prod.yml" config | grep -c "networks:" || true)
if [ "$NETWORKS" -gt 0 ]; then
    print_result 0 "Network isolation configured"
else
    print_result 1 "No networks defined in production compose"
fi

# Test 10: Check volume persistence
echo -e "\n${YELLOW}Testing volume persistence...${NC}"
VOLUMES=$(docker compose -f "$INFRA_DIR/docker/docker-compose.prod.yml" config | grep -c "volumes:" || true)
if [ "$VOLUMES" -gt 0 ]; then
    print_result 0 "Persistent volumes configured"
else
    print_result 1 "No volumes defined in production compose"
fi

# Print summary
echo -e "\n========================================="
echo -e "Test Summary"
echo -e "========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total:  $(($TESTS_PASSED + $TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All Docker Compose tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
