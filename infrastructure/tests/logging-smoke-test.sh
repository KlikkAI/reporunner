#!/bin/bash

# Logging Stack Smoke Test
# Tests ELK (Elasticsearch, Logstash, Kibana) and Filebeat configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGGING_DIR="$SCRIPT_DIR/../logging"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Logging Stack Smoke Tests"
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

# Test 1: Validate Elasticsearch configuration
echo -e "\n${YELLOW}Validating Elasticsearch configuration...${NC}"
if [ -f "$LOGGING_DIR/elasticsearch.yml" ]; then
    if grep -q "cluster.name:" "$LOGGING_DIR/elasticsearch.yml"; then
        print_result 0 "Elasticsearch config is valid"
    else
        print_result 1 "Elasticsearch config missing cluster name"
    fi
else
    print_result 1 "Elasticsearch configuration not found"
fi

# Test 2: Validate Kibana configuration
echo -e "\n${YELLOW}Validating Kibana configuration...${NC}"
if [ -f "$LOGGING_DIR/kibana.yml" ]; then
    if grep -q "server.host:" "$LOGGING_DIR/kibana.yml"; then
        print_result 0 "Kibana config is valid"
    else
        print_result 1 "Kibana config missing server.host"
    fi
else
    print_result 1 "Kibana configuration not found"
fi

# Test 3: Check Logstash pipelines
echo -e "\n${YELLOW}Checking Logstash pipelines...${NC}"
if [ -d "$LOGGING_DIR/logstash/pipeline" ]; then
    PIPELINE_COUNT=$(find "$LOGGING_DIR/logstash/pipeline" -name "*.conf" | wc -l)
    if [ "$PIPELINE_COUNT" -gt 0 ]; then
        print_result 0 "Logstash pipelines configured ($PIPELINE_COUNT pipelines)"
    else
        print_result 1 "No Logstash pipeline configurations found"
    fi
else
    print_result 1 "Logstash pipeline directory not found"
fi

# Test 4: Validate Logstash pipeline syntax
echo -e "\n${YELLOW}Validating Logstash pipeline syntax...${NC}"
INVALID_PIPELINES=0
for pipeline in "$LOGGING_DIR/logstash/pipeline"/*.conf 2>/dev/null; do
    if [ -f "$pipeline" ]; then
        # Basic syntax check - must have input, filter (optional), and output
        if grep -q "input {" "$pipeline" && grep -q "output {" "$pipeline"; then
            echo -e "${GREEN}  ✓ $(basename "$pipeline") has input and output${NC}"
        else
            echo -e "${RED}  ✗ $(basename "$pipeline") missing input or output${NC}"
            INVALID_PIPELINES=1
        fi
    fi
done

if [ $INVALID_PIPELINES -eq 0 ]; then
    print_result 0 "All Logstash pipelines have valid structure"
else
    print_result 1 "Some Logstash pipelines have invalid structure"
fi

# Test 5: Validate Filebeat configuration
echo -e "\n${YELLOW}Validating Filebeat configuration...${NC}"
if [ -f "$LOGGING_DIR/filebeat.yml" ]; then
    if command -v filebeat &> /dev/null; then
        if filebeat test config -c "$LOGGING_DIR/filebeat.yml" > /dev/null 2>&1; then
            print_result 0 "Filebeat config is valid"
        else
            print_result 1 "Filebeat config validation failed"
        fi
    else
        # If filebeat not available, check basic structure
        if grep -q "filebeat.inputs:" "$LOGGING_DIR/filebeat.yml"; then
            print_result 0 "Filebeat config exists with inputs"
        else
            print_result 1 "Filebeat config missing inputs"
        fi
    fi
else
    print_result 1 "Filebeat configuration not found"
fi

# Test 6: Check ElastAlert configuration
echo -e "\n${YELLOW}Checking ElastAlert configuration...${NC}"
if [ -f "$LOGGING_DIR/elastalert/config.yaml" ]; then
    if grep -q "rules_folder:" "$LOGGING_DIR/elastalert/config.yaml"; then
        print_result 0 "ElastAlert config is valid"
    else
        print_result 1 "ElastAlert config missing rules_folder"
    fi
else
    print_result 1 "ElastAlert configuration not found"
fi

# Test 7: Validate ElastAlert rules
echo -e "\n${YELLOW}Validating ElastAlert rules...${NC}"
if [ -d "$LOGGING_DIR/elastalert/rules" ]; then
    RULES_COUNT=$(find "$LOGGING_DIR/elastalert/rules" -name "*.yaml" | wc -l)
    if [ "$RULES_COUNT" -gt 0 ]; then
        print_result 0 "ElastAlert rules configured ($RULES_COUNT rules)"
    else
        print_result 1 "No ElastAlert rules found"
    fi
else
    print_result 1 "ElastAlert rules directory not found"
fi

# Test 8: Check alert rule syntax
echo -e "\n${YELLOW}Checking alert rule syntax...${NC}"
INVALID_RULES=0
for rule in "$LOGGING_DIR/elastalert/rules"/*.yaml 2>/dev/null; do
    if [ -f "$rule" ]; then
        # Check for required fields
        if grep -q "name:" "$rule" && grep -q "type:" "$rule" && grep -q "index:" "$rule"; then
            echo -e "${GREEN}  ✓ $(basename "$rule") has required fields${NC}"
        else
            echo -e "${RED}  ✗ $(basename "$rule") missing required fields${NC}"
            INVALID_RULES=1
        fi
    fi
done

if [ $INVALID_RULES -eq 0 ]; then
    print_result 0 "All ElastAlert rules have required fields"
else
    print_result 1 "Some ElastAlert rules are missing required fields"
fi

# Test 9: Validate logging docker-compose
echo -e "\n${YELLOW}Validating logging docker-compose...${NC}"
if [ -f "$LOGGING_DIR/docker-compose.yml" ]; then
    if docker compose -f "$LOGGING_DIR/docker-compose.yml" config > /dev/null 2>&1; then
        print_result 0 "Logging docker-compose is valid"
    else
        print_result 1 "Logging docker-compose validation failed"
    fi
else
    print_result 1 "Logging docker-compose not found"
fi

# Test 10: Check index templates
echo -e "\n${YELLOW}Checking Elasticsearch index templates...${NC}"
if [ -d "$LOGGING_DIR/index-templates" ] || grep -q "template" "$LOGGING_DIR/"*.json 2>/dev/null; then
    print_result 0 "Index templates configured"
else
    print_result 1 "No index templates found (optional but recommended)"
fi

# Test 11: Verify SMTP configuration for alerts
echo -e "\n${YELLOW}Checking SMTP configuration for alerts...${NC}"
if [ -f "$LOGGING_DIR/elastalert/smtp_auth.yaml" ]; then
    if grep -q "smtp_host:" "$LOGGING_DIR/elastalert/smtp_auth.yaml"; then
        print_result 0 "SMTP auth configured for alerts"
    else
        print_result 1 "SMTP auth file exists but missing smtp_host"
    fi
else
    print_result 1 "SMTP auth not configured (alerts may not work)"
fi

# Test 12: Check setup script
echo -e "\n${YELLOW}Checking ELK setup script...${NC}"
if [ -f "$LOGGING_DIR/setup-elk.sh" ]; then
    if [ -x "$LOGGING_DIR/setup-elk.sh" ]; then
        print_result 0 "Setup script exists and is executable"
    else
        print_result 1 "Setup script exists but is not executable"
    fi
else
    print_result 1 "Setup script not found"
fi

# Print summary
echo -e "\n========================================="
echo -e "Test Summary"
echo -e "========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total:  $(($TESTS_PASSED + $TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All logging stack tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
