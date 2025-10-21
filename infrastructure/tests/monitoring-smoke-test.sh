#!/bin/bash

# Monitoring Stack Smoke Test
# Tests Prometheus, Grafana, and Alertmanager configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$SCRIPT_DIR/../monitoring"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Monitoring Stack Smoke Tests"
echo "========================================="

TESTS_PASSED=0
TESTS_FAILED=0

print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Validate Prometheus configuration
echo -e "\n${YELLOW}Validating Prometheus configuration...${NC}"
if [ -f "$MONITORING_DIR/prometheus/prometheus.yml" ]; then
    if command -v promtool &> /dev/null; then
        if promtool check config "$MONITORING_DIR/prometheus/prometheus.yml" > /dev/null 2>&1; then
            print_result 0 "Prometheus config is valid"
        else
            print_result 1 "Prometheus config validation failed"
        fi
    else
        # If promtool not available, just check syntax
        if grep -q "scrape_configs:" "$MONITORING_DIR/prometheus/prometheus.yml"; then
            print_result 0 "Prometheus config exists and has scrape_configs"
        else
            print_result 1 "Prometheus config missing scrape_configs"
        fi
    fi
else
    print_result 1 "Prometheus configuration not found"
fi

# Test 2: Check Prometheus alert rules
echo -e "\n${YELLOW}Validating Prometheus alert rules...${NC}"
if [ -f "$MONITORING_DIR/prometheus/alerts/klikkflow-alerts.yml" ]; then
    if command -v promtool &> /dev/null; then
        if promtool check rules "$MONITORING_DIR/prometheus/alerts/klikkflow-alerts.yml" > /dev/null 2>&1; then
            print_result 0 "Prometheus alert rules are valid"
        else
            print_result 1 "Prometheus alert rules validation failed"
        fi
    else
        if grep -q "groups:" "$MONITORING_DIR/prometheus/alerts/klikkflow-alerts.yml"; then
            print_result 0 "Alert rules file exists with groups"
        else
            print_result 1 "Alert rules file malformed"
        fi
    fi
else
    print_result 1 "Prometheus alert rules not found"
fi

# Test 3: Verify scrape targets are configured
echo -e "\n${YELLOW}Checking Prometheus scrape targets...${NC}"
SCRAPE_JOBS=$(grep -c "job_name:" "$MONITORING_DIR/prometheus/prometheus.yml" || true)
if [ "$SCRAPE_JOBS" -ge 5 ]; then
    print_result 0 "Multiple scrape jobs configured ($SCRAPE_JOBS jobs)"
else
    print_result 1 "Insufficient scrape jobs (found $SCRAPE_JOBS, expected >= 5)"
fi

# Test 4: Validate Grafana provisioning
echo -e "\n${YELLOW}Checking Grafana provisioning...${NC}"
if [ -d "$MONITORING_DIR/grafana/provisioning" ]; then
    if [ -f "$MONITORING_DIR/grafana/provisioning/datasources/prometheus.yml" ]; then
        print_result 0 "Grafana datasource provisioning configured"
    else
        print_result 1 "Grafana datasource provisioning not found"
    fi
else
    print_result 1 "Grafana provisioning directory not found"
fi

# Test 5: Check Grafana dashboards
echo -e "\n${YELLOW}Checking Grafana dashboards...${NC}"
DASHBOARD_COUNT=$(find "$MONITORING_DIR/grafana/dashboard-configs" -name "*.json" 2>/dev/null | wc -l)
if [ "$DASHBOARD_COUNT" -ge 5 ]; then
    print_result 0 "Multiple Grafana dashboards configured ($DASHBOARD_COUNT dashboards)"
else
    print_result 1 "Insufficient dashboards (found $DASHBOARD_COUNT, expected >= 5)"
fi

# Test 6: Validate dashboard JSON syntax
echo -e "\n${YELLOW}Validating dashboard JSON syntax...${NC}"
INVALID_DASHBOARDS=0
for dashboard in "$MONITORING_DIR/grafana/dashboard-configs"/*.json; do
    if [ -f "$dashboard" ]; then
        if ! python3 -m json.tool "$dashboard" > /dev/null 2>&1; then
            echo -e "${RED}  - Invalid JSON: $(basename "$dashboard")${NC}"
            INVALID_DASHBOARDS=1
        fi
    fi
done

if [ $INVALID_DASHBOARDS -eq 0 ]; then
    print_result 0 "All dashboard JSON files are valid"
else
    print_result 1 "Some dashboard JSON files are invalid"
fi

# Test 7: Check Alertmanager configuration
echo -e "\n${YELLOW}Checking Alertmanager configuration...${NC}"
if [ -f "$MONITORING_DIR/alertmanager/alertmanager.yml" ]; then
    if command -v amtool &> /dev/null; then
        if amtool check-config "$MONITORING_DIR/alertmanager/alertmanager.yml" > /dev/null 2>&1; then
            print_result 0 "Alertmanager config is valid"
        else
            print_result 1 "Alertmanager config validation failed"
        fi
    else
        if grep -q "route:" "$MONITORING_DIR/alertmanager/alertmanager.yml"; then
            print_result 0 "Alertmanager config exists with routes"
        else
            print_result 1 "Alertmanager config missing routes"
        fi
    fi
else
    print_result 1 "Alertmanager configuration not found"
fi

# Test 8: Verify exporters configuration
echo -e "\n${YELLOW}Checking exporter configurations...${NC}"
EXPORTERS=("node_exporter" "mongodb_exporter" "postgres_exporter" "redis_exporter")
CONFIGURED_EXPORTERS=0

for exporter in "${EXPORTERS[@]}"; do
    if grep -q "$exporter" "$MONITORING_DIR/prometheus/prometheus.yml"; then
        ((CONFIGURED_EXPORTERS++))
    fi
done

if [ $CONFIGURED_EXPORTERS -ge 3 ]; then
    print_result 0 "Multiple exporters configured ($CONFIGURED_EXPORTERS exporters)"
else
    print_result 1 "Insufficient exporters configured (found $CONFIGURED_EXPORTERS, expected >= 3)"
fi

# Test 9: Check retention policies
echo -e "\n${YELLOW}Checking retention policies...${NC}"
if grep -q "storage.tsdb.retention" "$MONITORING_DIR/prometheus/prometheus.yml" || \
   grep -q "retention:" "$MONITORING_DIR/docker-compose.monitoring.yml" 2>/dev/null; then
    print_result 0 "Retention policy configured"
else
    print_result 1 "Retention policy not found"
fi

# Test 10: Validate monitoring stack docker-compose
echo -e "\n${YELLOW}Validating monitoring docker-compose...${NC}"
if [ -f "$SCRIPT_DIR/../docker/docker-compose.monitoring.yml" ]; then
    if docker compose -f "$SCRIPT_DIR/../docker/docker-compose.monitoring.yml" config > /dev/null 2>&1; then
        print_result 0 "Monitoring docker-compose is valid"
    else
        print_result 1 "Monitoring docker-compose validation failed"
    fi
else
    print_result 1 "Monitoring docker-compose not found"
fi

# Print summary
echo -e "\n========================================="
echo -e "Test Summary"
echo -e "========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total:  $(($TESTS_PASSED + $TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All monitoring stack tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
