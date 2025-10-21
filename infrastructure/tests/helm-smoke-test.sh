#!/bin/bash

# Helm Chart Smoke Test
# Tests Helm chart validity, linting, and template rendering

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELM_DIR="$SCRIPT_DIR/../kubernetes/helm"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Helm Chart Smoke Tests"
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

# Test 1: Check Helm installation
echo -e "\n${YELLOW}Checking Helm installation...${NC}"
if command -v helm &> /dev/null; then
    HELM_VERSION=$(helm version --short)
    print_result 0 "Helm is installed ($HELM_VERSION)"
else
    print_result 1 "Helm is not installed"
    echo -e "${RED}Please install Helm: https://helm.sh/docs/intro/install/${NC}"
    exit 1
fi

# Test 2: Validate Chart.yaml
echo -e "\n${YELLOW}Validating Chart.yaml...${NC}"
if [ -f "$HELM_DIR/Chart.yaml" ]; then
    if grep -q "name: klikkflow" "$HELM_DIR/Chart.yaml" && grep -q "version:" "$HELM_DIR/Chart.yaml"; then
        print_result 0 "Chart.yaml is valid"
    else
        print_result 1 "Chart.yaml is missing required fields"
    fi
else
    print_result 1 "Chart.yaml not found"
fi

# Test 3: Validate values.yaml
echo -e "\n${YELLOW}Validating values.yaml...${NC}"
if [ -f "$HELM_DIR/values.yaml" ]; then
    print_result 0 "values.yaml exists"
else
    print_result 1 "values.yaml not found"
fi

# Test 4: Helm lint
echo -e "\n${YELLOW}Running helm lint...${NC}"
if helm lint "$HELM_DIR" > /dev/null 2>&1; then
    print_result 0 "Helm lint passed"
else
    print_result 1 "Helm lint failed"
    helm lint "$HELM_DIR"
fi

# Test 5: Template rendering (dry-run)
echo -e "\n${YELLOW}Testing template rendering...${NC}"
if helm template test-release "$HELM_DIR" > /dev/null 2>&1; then
    print_result 0 "Template rendering successful"
else
    print_result 1 "Template rendering failed"
fi

# Test 6: Validate required templates exist
echo -e "\n${YELLOW}Checking required templates...${NC}"
REQUIRED_TEMPLATES=(
    "deployment-backend.yaml"
    "deployment-frontend.yaml"
    "service.yaml"
    "ingress.yaml"
    "configmap.yaml"
    "secret.yaml"
)

MISSING_TEMPLATES=0
for template in "${REQUIRED_TEMPLATES[@]}"; do
    if [ ! -f "$HELM_DIR/templates/$template" ]; then
        echo -e "${RED}  - Missing template: $template${NC}"
        MISSING_TEMPLATES=1
    fi
done

if [ $MISSING_TEMPLATES -eq 0 ]; then
    print_result 0 "All required templates exist"
else
    print_result 1 "Some required templates are missing"
fi

# Test 7: Validate HPA configuration
echo -e "\n${YELLOW}Checking HPA configuration...${NC}"
if [ -f "$HELM_DIR/templates/hpa.yaml" ]; then
    if grep -q "autoscaling" "$HELM_DIR/templates/hpa.yaml"; then
        print_result 0 "HPA template is configured"
    else
        print_result 1 "HPA template is malformed"
    fi
else
    print_result 1 "HPA template not found"
fi

# Test 8: Validate network policy
echo -e "\n${YELLOW}Checking NetworkPolicy...${NC}"
if [ -f "$HELM_DIR/templates/networkpolicy.yaml" ]; then
    print_result 0 "NetworkPolicy template exists"
else
    print_result 1 "NetworkPolicy template not found"
fi

# Test 9: Validate ServiceMonitor for Prometheus
echo -e "\n${YELLOW}Checking ServiceMonitor...${NC}"
if [ -f "$HELM_DIR/templates/servicemonitor.yaml" ]; then
    print_result 0 "ServiceMonitor template exists"
else
    print_result 1 "ServiceMonitor template not found"
fi

# Test 10: Check for security best practices
echo -e "\n${YELLOW}Checking security configurations...${NC}"
RENDERED=$(helm template test-release "$HELM_DIR")
SECURITY_ISSUES=0

# Check for runAsNonRoot
if echo "$RENDERED" | grep -q "runAsNonRoot: true"; then
    echo -e "${GREEN}  ✓ Containers run as non-root${NC}"
else
    echo -e "${RED}  ✗ Containers may run as root${NC}"
    SECURITY_ISSUES=1
fi

# Check for readOnlyRootFilesystem
if echo "$RENDERED" | grep -q "readOnlyRootFilesystem: true"; then
    echo -e "${GREEN}  ✓ Read-only root filesystem configured${NC}"
else
    echo -e "${YELLOW}  ! Read-only root filesystem not configured${NC}"
fi

if [ $SECURITY_ISSUES -eq 0 ]; then
    print_result 0 "Security best practices implemented"
else
    print_result 1 "Some security practices missing"
fi

# Test 11: Validate dependencies
echo -e "\n${YELLOW}Checking chart dependencies...${NC}"
if helm dependency list "$HELM_DIR" > /dev/null 2>&1; then
    print_result 0 "Dependencies are valid"
else
    print_result 1 "Dependencies check failed"
fi

# Test 12: Test with custom values
echo -e "\n${YELLOW}Testing with custom values...${NC}"
cat > /tmp/test-values.yaml <<EOF
replicaCount: 3
image:
  tag: "test"
ingress:
  enabled: true
  host: test.example.com
EOF

if helm template test-release "$HELM_DIR" -f /tmp/test-values.yaml > /dev/null 2>&1; then
    print_result 0 "Custom values override works"
    rm /tmp/test-values.yaml
else
    print_result 1 "Custom values override failed"
    rm /tmp/test-values.yaml
fi

# Print summary
echo -e "\n========================================="
echo -e "Test Summary"
echo -e "========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total:  $(($TESTS_PASSED + $TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All Helm chart tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
