#!/bin/bash

# Observability Stack Smoke Test
# Tests OpenTelemetry, Jaeger, Tempo, and Loki configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OBSERVABILITY_DIR="$SCRIPT_DIR/../observability"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Observability Stack Smoke Tests"
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

# Test 1: Validate OpenTelemetry Collector configuration
echo -e "\n${YELLOW}Validating OpenTelemetry Collector configuration...${NC}"
if [ -f "$OBSERVABILITY_DIR/otel-collector-config.yaml" ]; then
    # Check for required sections
    if grep -q "receivers:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" && \
       grep -q "exporters:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" && \
       grep -q "service:" "$OBSERVABILITY_DIR/otel-collector-config.yaml"; then
        print_result 0 "OpenTelemetry Collector config is valid"
    else
        print_result 1 "OpenTelemetry Collector config missing required sections"
    fi
else
    print_result 1 "OpenTelemetry Collector configuration not found"
fi

# Test 2: Check OTLP receiver configuration
echo -e "\n${YELLOW}Checking OTLP receiver configuration...${NC}"
if grep -q "otlp:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" 2>/dev/null; then
    if grep -q "grpc:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" && \
       grep -q "http:" "$OBSERVABILITY_DIR/otel-collector-config.yaml"; then
        print_result 0 "OTLP receiver configured with gRPC and HTTP"
    else
        print_result 1 "OTLP receiver missing gRPC or HTTP endpoints"
    fi
else
    print_result 1 "OTLP receiver not configured"
fi

# Test 3: Verify multiple receiver protocols
echo -e "\n${YELLOW}Checking receiver protocols...${NC}"
RECEIVERS=("jaeger:" "zipkin:" "prometheus:")
CONFIGURED_RECEIVERS=0

for receiver in "${RECEIVERS[@]}"; do
    if grep -q "$receiver" "$OBSERVABILITY_DIR/otel-collector-config.yaml" 2>/dev/null; then
        ((CONFIGURED_RECEIVERS++))
    fi
done

if [ $CONFIGURED_RECEIVERS -ge 2 ]; then
    print_result 0 "Multiple receiver protocols configured ($CONFIGURED_RECEIVERS protocols)"
else
    print_result 1 "Insufficient receiver protocols (found $CONFIGURED_RECEIVERS, expected >= 2)"
fi

# Test 4: Check exporters configuration
echo -e "\n${YELLOW}Checking exporters configuration...${NC}"
EXPORTERS=("jaeger:" "tempo:" "loki:" "prometheus:")
CONFIGURED_EXPORTERS=0

for exporter in "${EXPORTERS[@]}"; do
    if grep -q "$exporter" "$OBSERVABILITY_DIR/otel-collector-config.yaml" 2>/dev/null; then
        ((CONFIGURED_EXPORTERS++))
    fi
done

if [ $CONFIGURED_EXPORTERS -ge 2 ]; then
    print_result 0 "Multiple exporters configured ($CONFIGURED_EXPORTERS exporters)"
else
    print_result 1 "Insufficient exporters configured (found $CONFIGURED_EXPORTERS, expected >= 2)"
fi

# Test 5: Validate processors configuration
echo -e "\n${YELLOW}Checking processors configuration...${NC}"
if grep -q "processors:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" 2>/dev/null; then
    if grep -q "batch:" "$OBSERVABILITY_DIR/otel-collector-config.yaml"; then
        print_result 0 "Processors configured with batch processing"
    else
        print_result 1 "Batch processor not configured"
    fi
else
    print_result 1 "No processors configured"
fi

# Test 6: Check Jaeger configuration
echo -e "\n${YELLOW}Checking Jaeger configuration...${NC}"
if [ -f "$OBSERVABILITY_DIR/jaeger-config.yaml" ] || \
   grep -q "jaeger" "$OBSERVABILITY_DIR/docker-compose.yml" 2>/dev/null; then
    print_result 0 "Jaeger is configured"
else
    print_result 1 "Jaeger configuration not found"
fi

# Test 7: Validate Tempo configuration
echo -e "\n${YELLOW}Checking Tempo configuration...${NC}"
if [ -f "$OBSERVABILITY_DIR/tempo-config.yaml" ] || \
   grep -q "tempo" "$OBSERVABILITY_DIR/docker-compose.yml" 2>/dev/null; then
    print_result 0 "Tempo is configured"
else
    print_result 1 "Tempo configuration not found"
fi

# Test 8: Check Loki configuration
echo -e "\n${YELLOW}Checking Loki configuration...${NC}"
if [ -f "$OBSERVABILITY_DIR/loki-config.yaml" ] || \
   grep -q "loki" "$OBSERVABILITY_DIR/docker-compose.yml" 2>/dev/null; then
    print_result 0 "Loki is configured"
else
    print_result 1 "Loki configuration not found"
fi

# Test 9: Validate Promtail configuration
echo -e "\n${YELLOW}Checking Promtail configuration...${NC}"
if [ -f "$OBSERVABILITY_DIR/promtail-config.yaml" ]; then
    if grep -q "clients:" "$OBSERVABILITY_DIR/promtail-config.yaml" && \
       grep -q "scrape_configs:" "$OBSERVABILITY_DIR/promtail-config.yaml"; then
        print_result 0 "Promtail config is valid"
    else
        print_result 1 "Promtail config missing clients or scrape_configs"
    fi
else
    print_result 1 "Promtail configuration not found"
fi

# Test 10: Check instrumentation libraries
echo -e "\n${YELLOW}Checking instrumentation libraries...${NC}"
if [ -d "$OBSERVABILITY_DIR/instrumentation" ]; then
    INSTRUMENTATION_LANGS=$(find "$OBSERVABILITY_DIR/instrumentation" -mindepth 1 -maxdepth 1 -type d | wc -l)
    if [ "$INSTRUMENTATION_LANGS" -gt 0 ]; then
        print_result 0 "Instrumentation libraries configured ($INSTRUMENTATION_LANGS languages)"
    else
        print_result 1 "No instrumentation libraries found"
    fi
else
    print_result 1 "Instrumentation directory not found"
fi

# Test 11: Validate observability docker-compose
echo -e "\n${YELLOW}Validating observability docker-compose...${NC}"
if [ -f "$OBSERVABILITY_DIR/docker-compose.yml" ]; then
    if docker compose -f "$OBSERVABILITY_DIR/docker-compose.yml" config > /dev/null 2>&1; then
        print_result 0 "Observability docker-compose is valid"
    else
        print_result 1 "Observability docker-compose validation failed"
    fi
else
    print_result 1 "Observability docker-compose not found"
fi

# Test 12: Check service pipelines
echo -e "\n${YELLOW}Checking service pipelines...${NC}"
if grep -q "pipelines:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" 2>/dev/null; then
    PIPELINE_TYPES=("traces:" "metrics:" "logs:")
    CONFIGURED_PIPELINES=0

    for pipeline in "${PIPELINE_TYPES[@]}"; do
        if grep -A 5 "pipelines:" "$OBSERVABILITY_DIR/otel-collector-config.yaml" | grep -q "$pipeline"; then
            ((CONFIGURED_PIPELINES++))
        fi
    done

    if [ $CONFIGURED_PIPELINES -eq 3 ]; then
        print_result 0 "All pipeline types configured (traces, metrics, logs)"
    else
        print_result 1 "Not all pipeline types configured (found $CONFIGURED_PIPELINES/3)"
    fi
else
    print_result 1 "No service pipelines configured"
fi

# Test 13: Verify port configurations
echo -e "\n${YELLOW}Checking port configurations...${NC}"
CRITICAL_PORTS=("4317" "4318" "9411" "14250")
CONFIGURED_PORTS=0

for port in "${CRITICAL_PORTS[@]}"; do
    if grep -q "$port" "$OBSERVABILITY_DIR/otel-collector-config.yaml" 2>/dev/null || \
       grep -q "$port" "$OBSERVABILITY_DIR/docker-compose.yml" 2>/dev/null; then
        ((CONFIGURED_PORTS++))
    fi
done

if [ $CONFIGURED_PORTS -ge 2 ]; then
    print_result 0 "Critical ports configured ($CONFIGURED_PORTS ports)"
else
    print_result 1 "Some critical ports not configured"
fi

# Print summary
echo -e "\n========================================="
echo -e "Test Summary"
echo -e "========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total:  $(($TESTS_PASSED + $TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All observability stack tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
