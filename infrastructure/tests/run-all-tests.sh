#!/bin/bash

# Infrastructure Smoke Test Suite Runner
# Executes all infrastructure validation tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=================================================="
echo "  Reporunner Infrastructure Test Suite"
echo "=================================================="
echo -e "${NC}"

# Test suites to run
TESTS=(
    "docker-compose-smoke-test.sh"
    "helm-smoke-test.sh"
    "monitoring-smoke-test.sh"
    "logging-smoke-test.sh"
    "observability-smoke-test.sh"
)

# Track results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0
SUITE_RESULTS=()

# Parse command line arguments
VERBOSE=0
FAIL_FAST=0
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        -f|--fail-fast)
            FAIL_FAST=1
            shift
            ;;
        -t|--test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose      Show detailed test output"
            echo "  -f, --fail-fast    Stop on first test failure"
            echo "  -t, --test NAME    Run specific test suite"
            echo "  -h, --help         Show this help message"
            echo ""
            echo "Available test suites:"
            for test in "${TESTS[@]}"; do
                echo "  - ${test%.sh}"
            done
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to run a test suite
run_test_suite() {
    local test_script="$1"
    local test_name="${test_script%.sh}"

    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    ((TOTAL_SUITES++))

    if [ $VERBOSE -eq 1 ]; then
        # Run with full output
        if bash "$SCRIPT_DIR/$test_script"; then
            echo -e "${GREEN}✓ $test_name PASSED${NC}"
            ((PASSED_SUITES++))
            SUITE_RESULTS+=("✓ $test_name")
            return 0
        else
            echo -e "${RED}✗ $test_name FAILED${NC}"
            ((FAILED_SUITES++))
            SUITE_RESULTS+=("✗ $test_name")
            return 1
        fi
    else
        # Run with suppressed output unless it fails
        local output
        if output=$(bash "$SCRIPT_DIR/$test_script" 2>&1); then
            echo -e "${GREEN}✓ $test_name PASSED${NC}"
            ((PASSED_SUITES++))
            SUITE_RESULTS+=("✓ $test_name")
            return 0
        else
            echo -e "${RED}✗ $test_name FAILED${NC}"
            echo -e "${YELLOW}Error output:${NC}"
            echo "$output"
            ((FAILED_SUITES++))
            SUITE_RESULTS+=("✗ $test_name")
            return 1
        fi
    fi
}

# Run tests
if [ -n "$SPECIFIC_TEST" ]; then
    # Run specific test
    TEST_FILE="${SPECIFIC_TEST}.sh"
    if [ ! -f "$SCRIPT_DIR/$TEST_FILE" ]; then
        echo -e "${RED}Error: Test suite '$SPECIFIC_TEST' not found${NC}"
        echo "Available tests:"
        for test in "${TESTS[@]}"; do
            echo "  - ${test%.sh}"
        done
        exit 1
    fi
    run_test_suite "$TEST_FILE"
else
    # Run all tests
    for test in "${TESTS[@]}"; do
        if [ ! -f "$SCRIPT_DIR/$test" ]; then
            echo -e "${YELLOW}Warning: Test script $test not found, skipping...${NC}"
            continue
        fi

        if ! run_test_suite "$test"; then
            if [ $FAIL_FAST -eq 1 ]; then
                echo -e "${RED}Fail-fast enabled. Stopping test execution.${NC}"
                break
            fi
        fi
    done
fi

# Print summary
echo -e "\n${BLUE}=================================================="
echo "  Test Summary"
echo "==================================================${NC}"

for result in "${SUITE_RESULTS[@]}"; do
    if [[ $result == ✓* ]]; then
        echo -e "${GREEN}$result${NC}"
    else
        echo -e "${RED}$result${NC}"
    fi
done

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Total Suites:  $TOTAL_SUITES"
echo -e "${GREEN}Passed:        $PASSED_SUITES${NC}"
echo -e "${RED}Failed:        $FAILED_SUITES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Exit with appropriate code
if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "\n${GREEN}✓ All infrastructure tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some infrastructure tests failed.${NC}"
    echo -e "${YELLOW}Run with --verbose flag for detailed output.${NC}"
    exit 1
fi
