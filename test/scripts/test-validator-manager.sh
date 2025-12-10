#!/usr/bin/env bash
set -euo pipefail

# ----------------------------------------
# ValidatorManager Tasks Test Script
# ----------------------------------------
# This script tests all ValidatorManager tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-validator-manager.sh <network>
#
# Example:
#   ./test-validator-manager.sh genesis_validation_network_k1
# ----------------------------------------

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
SUCCESS_COUNT=0
ERROR_COUNT=0
TOTAL_TESTS=0

# Network parameter (required)
if [[ $# -eq 0 ]]; then
    echo -e "${RED}❌ Error: Network parameter is required${NC}"
    echo "Usage: $0 <network>"
    echo "Example: $0 genesis_validation_network_k1"
    exit 1
fi

NETWORK="$1"

# Configuration
DIAMOND="${DIAMOND:-0x00000000000000000000000000000000000015BE}"
VALID_NODE_ID="${VALID_NODE_ID:-0x919ea79910a3668f4b1b1b7b833337a9ef65f1754f9ef2c227bffea0cf588722}"
VALID_ENODE="${VALID_ENODE:-enode://8892b3cc26ce2a9b48e8847ce4a3e16411a1d73f4abc361736baac8a507982f0e15daaa2746720a7f43a49984405bf870046c179982a0fd45b9fe8f4df22aa86@172.16.240.32:30306}"
INVALID_NODE_ID="0xINVALIDNODEID"
INVALID_ENODE="enode://INVALID"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} ValidatorManager Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Valid Node ID: ${VALID_NODE_ID}"
echo -e "Valid Enode: ${VALID_ENODE}"
echo ""

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expect_success="$3"  # "true" or "false"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test ${TOTAL_TESTS}: ${test_name}${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Command: ${command}"
    echo ""
    
    if eval "$command" 2>&1; then
        if [[ "$expect_success" == "true" ]]; then
            echo -e "${GREEN}✅ PASS: Test succeeded as expected${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "${RED}❌ FAIL: Test should have failed but succeeded${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    else
        if [[ "$expect_success" == "false" ]]; then
            echo -e "${GREEN}✅ PASS: Test failed as expected${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo -e "${RED}❌ FAIL: Test should have succeeded but failed${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    fi
    
    echo ""
}

# ============================================
# Test Suite: addValidator
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addValidator${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addValidator - Valid Enode" \
    "npx hardhat addValidator --enode '${VALID_ENODE}' --network ${NETWORK}" \
    "true"

run_test \
    "addValidator - Invalid Enode format" \
    "npx hardhat addValidator --enode '${INVALID_ENODE}' --network ${NETWORK}" \
    "false"

run_test \
    "addValidator - Missing enode parameter" \
    "npx hardhat addValidator --network ${NETWORK}" \
    "false"

run_test \
    "addValidator - Duplicate Enode (should fail if already added)" \
    "npx hardhat addValidator --enode '${VALID_ENODE}' --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: addValidatorStandby
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addValidatorStandby${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addValidatorStandby - Valid Enode" \
    "npx hardhat addValidatorStandby --enode 'enode://1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef@172.16.240.33:30306' --network ${NETWORK}" \
    "true"

run_test \
    "addValidatorStandby - Invalid Enode format" \
    "npx hardhat addValidatorStandby --enode '${INVALID_ENODE}' --network ${NETWORK}" \
    "false"

run_test \
    "addValidatorStandby - Missing enode parameter" \
    "npx hardhat addValidatorStandby --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: promoteValidator
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: promoteValidator${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "promoteValidator - Valid standby Node ID" \
    "npx hardhat promoteValidator --node-id 0x3cd7f351eade981f627a538640f7e4a7446390c7d940b4d8b204463cefb7f6d4 --network ${NETWORK}" \
    "true"

run_test \
    "promoteValidator - Invalid Node ID format" \
    "npx hardhat promoteValidator --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "promoteValidator - Non-existent Node ID" \
    "npx hardhat promoteValidator --node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa --network ${NETWORK}" \
    "false"

run_test \
    "promoteValidator - Missing node-id parameter" \
    "npx hardhat promoteValidator --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: standbyValidator
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: standbyValidator${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "standbyValidator - Valid active Node ID" \
    "npx hardhat standbyValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "standbyValidator - Invalid Node ID format" \
    "npx hardhat standbyValidator --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "standbyValidator - Non-existent Node ID" \
    "npx hardhat standbyValidator --node-id 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb --network ${NETWORK}" \
    "false"

run_test \
    "standbyValidator - Missing node-id parameter" \
    "npx hardhat standbyValidator --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: quarantineValidator
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: quarantineValidator${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "quarantineValidator - Valid standby Node ID" \
    "npx hardhat quarantineValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "quarantineValidator - Invalid Node ID format" \
    "npx hardhat quarantineValidator --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "quarantineValidator - Non-existent Node ID" \
    "npx hardhat quarantineValidator --node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa --network ${NETWORK}" \
    "false"

run_test \
    "quarantineValidator - Missing node-id parameter" \
    "npx hardhat quarantineValidator --network ${NETWORK}" \
    "false"

run_test \
    "quarantineValidator - Already quarantined node (should fail)" \
    "npx hardhat quarantineValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: unquarantineValidator
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: unquarantineValidator${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "unquarantineValidator - Valid quarantined Node ID" \
    "npx hardhat unquarantineValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "unquarantineValidator - Invalid Node ID format" \
    "npx hardhat unquarantineValidator --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineValidator - Non-quarantined Node ID (should fail)" \
    "npx hardhat unquarantineValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineValidator - Non-existent Node ID" \
    "npx hardhat unquarantineValidator --node-id 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineValidator - Missing node-id parameter" \
    "npx hardhat unquarantineValidator --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: removeValidator
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: removeValidator${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "removeValidator - Valid Node ID" \
    "npx hardhat removeValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "removeValidator - Invalid Node ID format" \
    "npx hardhat removeValidator --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "removeValidator - Already removed Node ID (should fail)" \
    "npx hardhat removeValidator --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "removeValidator - Non-existent Node ID" \
    "npx hardhat removeValidator --node-id 0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc --network ${NETWORK}" \
    "false"

run_test \
    "removeValidator - Missing node-id parameter" \
    "npx hardhat removeValidator --network ${NETWORK}" \
    "false"

# ============================================
# Final Results
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} Test Results Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}Failed: ${ERROR_COUNT}${NC}"
echo -e "${BLUE}============================================${NC}"

# Exit with appropriate code
if [[ $ERROR_COUNT -eq 0 ]]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
