#!/usr/bin/env bash
set -euo pipefail

# ----------------------------------------
# BesuNodeManager Tasks Test Script
# ----------------------------------------
# This script tests all BesuNodeManager tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-besu-node-manager.sh <network>
#
# Example:
#   ./test-besu-node-manager.sh genesis_validation_network_k1
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
echo -e "${BLUE} BesuNodeManager Tasks Test Suite${NC}"
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
# Test Suite: addExecutionNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addExecutionNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addExecutionNode - Valid Enode" \
    "npx hardhat addExecutionNode --enode '${VALID_ENODE}' --network ${NETWORK}" \
    "true"

run_test \
    "addExecutionNode - Invalid Enode format" \
    "npx hardhat addExecutionNode --enode '${INVALID_ENODE}' --network ${NETWORK}" \
    "false"

run_test \
    "addExecutionNode - Missing enode parameter" \
    "npx hardhat addExecutionNode --network ${NETWORK}" \
    "false"

run_test \
    "addExecutionNode - Duplicate Enode (should fail if already added)" \
    "npx hardhat addExecutionNode --enode '${VALID_ENODE}' --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: quarantineExecutionNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: quarantineExecutionNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "quarantineExecutionNode - Valid Node ID" \
    "npx hardhat quarantineExecutionNode --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "quarantineExecutionNode - Invalid Node ID format" \
    "npx hardhat quarantineExecutionNode --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "quarantineExecutionNode - Non-existent Node ID" \
    "npx hardhat quarantineExecutionNode --node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa --network ${NETWORK}" \
    "false"

run_test \
    "quarantineExecutionNode - Missing node-id parameter" \
    "npx hardhat quarantineExecutionNode --network ${NETWORK}" \
    "false"

run_test \
    "quarantineExecutionNode - Already quarantined node (should fail)" \
    "npx hardhat quarantineExecutionNode --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: unquarantineExecutionNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: unquarantineExecutionNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "unquarantineExecutionNode - Valid quarantined Node ID" \
    "npx hardhat unquarantineExecutionNode --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "unquarantineExecutionNode - Invalid Node ID format" \
    "npx hardhat unquarantineExecutionNode --node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineExecutionNode - Non-quarantined Node ID (should fail)" \
    "npx hardhat unquarantineExecutionNode --node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineExecutionNode - Non-existent Node ID" \
    "npx hardhat unquarantineExecutionNode --node-id 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb --network ${NETWORK}" \
    "false"

run_test \
    "unquarantineExecutionNode - Missing node-id parameter" \
    "npx hardhat unquarantineExecutionNode --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: removeExecutionNode
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: removeExecutionNode${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "removeExecutionNode - Valid Node ID" \
    "npx hardhat removeExecutionNode --execution-node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "true"

run_test \
    "removeExecutionNode - Invalid Node ID format" \
    "npx hardhat removeExecutionNode --execution-node-id ${INVALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "removeExecutionNode - Already removed Node ID (should fail)" \
    "npx hardhat removeExecutionNode --execution-node-id ${VALID_NODE_ID} --network ${NETWORK}" \
    "false"

run_test \
    "removeExecutionNode - Non-existent Node ID" \
    "npx hardhat removeExecutionNode --execution-node-id 0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc --network ${NETWORK}" \
    "false"

run_test \
    "removeExecutionNode - Missing execution-node-id parameter" \
    "npx hardhat removeExecutionNode --network ${NETWORK}" \
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
