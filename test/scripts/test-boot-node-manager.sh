#!/usr/bin/env bash
set -euo pipefail

# ----------------------------------------
# BootNodeManager Tasks Test Script
# ----------------------------------------
# This script tests all BootNodeManager tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-boot-node-manager.sh <network>
#
# Example:
#   ./test-boot-node-manager.sh genesis_validation_network_k1
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
echo -e "${BLUE} BootNodeManager Tasks Test Suite${NC}"
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
# Test Suite: addBootNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addBootNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addBootNode - Valid Enode" \
    "npx hardhat addBootNode --enode '${VALID_ENODE}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addBootNode - Invalid Enode format" \
    "npx hardhat addBootNode --enode '${INVALID_ENODE}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addBootNode - Missing enode parameter" \
    "npx hardhat addBootNode --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addBootNode - Duplicate Enode (should fail if already added)" \
    "npx hardhat addBootNode --enode '${VALID_ENODE}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: quarantineBootNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: quarantineBootNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "quarantineBootNode - Valid Node ID" \
    "npx hardhat quarantineBootNode --node-id ${VALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "quarantineBootNode - Invalid Node ID format" \
    "npx hardhat quarantineBootNode --node-id ${INVALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "quarantineBootNode - Non-existent Node ID" \
    "npx hardhat quarantineBootNode --node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "quarantineBootNode - Missing node-id parameter" \
    "npx hardhat quarantineBootNode --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "quarantineBootNode - Already quarantined node (should fail)" \
    "npx hardhat quarantineBootNode --node-id ${VALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: unquarantineBootNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: unquarantineBootNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "unquarantineBootNode - Valid quarantined Node ID" \
    "npx hardhat unquarantineBootNode --node-id ${VALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "unquarantineBootNode - Invalid Node ID format" \
    "npx hardhat unquarantineBootNode --node-id ${INVALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineBootNode - Non-quarantined Node ID (should fail)" \
    "npx hardhat unquarantineBootNode --node-id ${VALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineBootNode - Non-existent Node ID" \
    "npx hardhat unquarantineBootNode --node-id 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineBootNode - Missing node-id parameter" \
    "npx hardhat unquarantineBootNode --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: removeBootNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: removeBootNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "removeBootNode - Valid Node ID" \
    "npx hardhat removeBootNode --node-id ${VALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "removeBootNode - Invalid Node ID format" \
    "npx hardhat removeBootNode --node-id ${INVALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "removeBootNode - Already removed Node ID (should fail)" \
    "npx hardhat removeBootNode --node-id ${VALID_NODE_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "removeBootNode - Non-existent Node ID" \
    "npx hardhat removeBootNode --node-id 0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "removeBootNode - Missing node-id parameter" \
    "npx hardhat removeBootNode --diamond ${DIAMOND} --network ${NETWORK}" \
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
