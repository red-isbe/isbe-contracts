#!/bin/bash

# -----------------------------------------------------------------------------------
# Copyright (c) 2025 Comunidad de Madrid & Alastria
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# -----------------------------------------------------------------------------------

# Test script for makeGenesis.sh validation
# This script tests various failure scenarios to ensure proper error handling

set +e  # Don't exit on errors, we want to test error conditions

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test script location
SCRIPT_PATH="../makeGenesis.sh"
VALID_TEMPLATE="../sdk/config/besu-genesis-secp256k1.json"
VALID_GOV_ADDRESS="0x1234567890123456789012345678901234567890"
VALID_OUTPUT="test_output_genesis.json"
VALID_BESU_DIR="../isbe-besu-local-deployer"

# Cleanup function
cleanup() {
    rm -f "$VALID_OUTPUT" test_temp_*.json genesis_temp.json invalid_template.json empty_file.json malformed.json test_temp_nostructure.json
}

# Run cleanup at start and on exit
cleanup
trap cleanup EXIT

# Helper function to run a test
run_test() {
    local test_name="$1"
    local expected_result="$2"  # "fail" or "success"
    shift 2
    local command="$@"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}Test #${TOTAL_TESTS}: ${test_name}${NC}"
    echo "Command: $command"
    echo "Expected: $expected_result"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Run the command and capture output
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    # Determine if test passed
    if [ "$expected_result" = "fail" ]; then
        if [ $exit_code -ne 0 ]; then
            echo -e "${GREEN}✓ PASSED${NC} - Script failed as expected (exit code: $exit_code)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ FAILED${NC} - Script should have failed but succeeded"
            echo "Output: $output"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        if [ $exit_code -eq 0 ]; then
            echo -e "${GREEN}✓ PASSED${NC} - Script succeeded as expected"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ FAILED${NC} - Script should have succeeded but failed (exit code: $exit_code)"
            echo "Output: $output"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
}

echo "════════════════════════════════════════════════════════════════"
echo "  makeGenesis.sh Validation Test Suite"
echo "════════════════════════════════════════════════════════════════"

# Test 1: Missing template file parameter
run_test "Missing template file parameter" "fail" \
    "bash $SCRIPT_PATH --skip-gen --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"

# Test 2: Missing governance address
run_test "Missing governance address" "fail" \
    "bash $SCRIPT_PATH --skip-gen --template-file $VALID_TEMPLATE --output-file $VALID_OUTPUT"

# Test 3: Missing output file when not skipping generation
run_test "Missing output file (not skipping gen)" "fail" \
    "bash $SCRIPT_PATH --template-file $VALID_TEMPLATE --governance-address $VALID_GOV_ADDRESS"

# Test 4: Non-existent template file
run_test "Non-existent template file" "fail" \
    "bash $SCRIPT_PATH --skip-gen --template-file non_existent_file.json --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"

# Test 5: Invalid JSON template file
echo "not valid json" > malformed.json
run_test "Invalid JSON template file" "fail" \
    "bash $SCRIPT_PATH --skip-gen --template-file malformed.json --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"

# Test 6: Output file already exists
touch "$VALID_OUTPUT"
run_test "Output file already exists" "fail" \
    "bash $SCRIPT_PATH --template-file $VALID_TEMPLATE --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"
rm -f "$VALID_OUTPUT"

# Test 7: Non-existent Besu directory when not skipping startup
run_test "Non-existent Besu directory" "fail" \
    "bash $SCRIPT_PATH --skip-gen --do-besu-startup --besu-dir /non/existent/path --template-file $VALID_TEMPLATE --governance-address $VALID_GOV_ADDRESS"

# Test 8: Governance address already in template alloc
if [ -f "$VALID_TEMPLATE" ]; then
    # Create a template with governance address already allocated
    jq --arg addr "$VALID_GOV_ADDRESS" '.alloc[$addr] = {"balance": "0x0"}' "$VALID_TEMPLATE" > invalid_template.json 2>/dev/null
    if [ -f invalid_template.json ] && [ -s invalid_template.json ]; then
        run_test "Governance address already in alloc" "fail" \
            "bash $SCRIPT_PATH --skip-gen --template-file invalid_template.json --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"
    else
        echo -e "${YELLOW}⊘ SKIPPED${NC} - Could not create test template with governance address"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
fi

# Test 9: Local template without secret file
if [ -f "$VALID_TEMPLATE" ]; then
    # Create a local template
    jq '.version = "genesis-local-template"' "$VALID_TEMPLATE" > test_temp_local.json 2>/dev/null
    if [ -f test_temp_local.json ] && [ -s test_temp_local.json ]; then
        run_test "Local template without secret file" "fail" \
            "bash $SCRIPT_PATH --skip-gen --template-file test_temp_local.json --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"
    else
        echo -e "${YELLOW}⊘ SKIPPED${NC} - Could not create local template for testing"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    fi
fi

# Test 10: Invalid governance address format
run_test "Invalid governance address format" "fail" \
    "bash $SCRIPT_PATH --skip-gen --template-file $VALID_TEMPLATE --output-file $VALID_OUTPUT --governance-address 0xinvalid"

# Test 11: Empty template file
touch empty_file.json
run_test "Empty template file" "fail" \
    "bash $SCRIPT_PATH --skip-gen --template-file empty_file.json --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"

# Test 12: Template file without required structure
echo '{"someField": "value"}' > test_temp_nostructure.json
run_test "Template without required structure" "fail" \
    "bash $SCRIPT_PATH --skip-gen --template-file test_temp_nostructure.json --output-file $VALID_OUTPUT --governance-address $VALID_GOV_ADDRESS"

# Print summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Test Summary"
echo "════════════════════════════════════════════════════════════════"
echo "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi

