#!/usr/bin/env bash

# --------------------------------------------------------------
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
# --------------------------------------------------------------
set -euo pipefail

# ----------------------------------------
# NetworkDirectory Tasks Test Script
# ----------------------------------------
# This script tests all NetworkDirectory tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-network-directory.sh <network>
#
# Example:
#   ./test-network-directory.sh genesis_validation_network_k1
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
TEST_CHAIN_ID=2024
TEST_NETWORK_NAME="Test Network"
TEST_NETWORK_SYMBOL="TEST"
UPDATED_NETWORK_NAME="Updated Test Network"
UPDATED_NETWORK_SYMBOL="UTEST"
TEST_ALGORITHM=1  # SECP256K1
TEST_STAGE=1      # DEV
UPDATED_STAGE=2   # PRE
TEST_RESOURCES='[{"resourceId":"RPC","resource":"https://rpc.test.io"},{"resourceId":"EXPLORER","resource":"https://explorer.test.io"}]'
TEST_RESOURCE_ID="RPC"
TEST_RESOURCE_VALUE="https://rpc.updated.io"
INVALID_CHAIN_ID=999999999
NONEXISTENT_CHAIN_ID=123456789

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} NetworkDirectory Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test Chain ID: ${TEST_CHAIN_ID}"
echo -e "Test Network Name: ${TEST_NETWORK_NAME}"
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
# Test Suite: createNetwork
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: createNetwork${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "createNetwork - Valid parameters with resources" \
    "npx hardhat createNetwork --chain-id ${TEST_CHAIN_ID} --name '${TEST_NETWORK_NAME}' --symbol '${TEST_NETWORK_SYMBOL}' --algorithm ${TEST_ALGORITHM} --stage ${TEST_STAGE} --resources '${TEST_RESOURCES}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "createNetwork - Valid parameters without resources" \
    "npx hardhat createNetwork --chain-id 2025 --name 'Another Network' --symbol 'ANET' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "createNetwork - Missing chain-id parameter" \
    "npx hardhat createNetwork --name 'Test' --symbol 'TST' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "createNetwork - Missing name parameter" \
    "npx hardhat createNetwork --chain-id 2026 --symbol 'TST' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "createNetwork - Missing symbol parameter" \
    "npx hardhat createNetwork --chain-id 2027 --name 'Test' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "createNetwork - Invalid algorithm (out of range)" \
    "npx hardhat createNetwork --chain-id 2028 --name 'Test' --symbol 'TST' --algorithm 99 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "createNetwork - Invalid stage (out of range)" \
    "npx hardhat createNetwork --chain-id 2029 --name 'Test' --symbol 'TST' --algorithm 1 --stage 99 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "createNetwork - Duplicate chain ID (should fail)" \
    "npx hardhat createNetwork --chain-id ${TEST_CHAIN_ID} --name 'Duplicate' --symbol 'DUP' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "createNetwork - Invalid resources JSON format" \
    "npx hardhat createNetwork --chain-id 2030 --name 'Test' --symbol 'TST' --algorithm 1 --stage 1 --resources 'INVALID_JSON' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getNetwork
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getNetwork${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getNetwork - Valid chain ID (existing network)" \
    "npx hardhat getNetwork --chain-id ${TEST_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetwork - Non-existent chain ID" \
    "npx hardhat getNetwork --chain-id ${NONEXISTENT_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetwork - Missing chain-id parameter" \
    "npx hardhat getNetwork --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getNetwork - Invalid chain ID (negative)" \
    "npx hardhat getNetwork --chain-id -1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getAllNetworks
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getAllNetworks${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getAllNetworks - Valid call" \
    "npx hardhat getAllNetworks --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getAllNetworks - Missing diamond parameter" \
    "npx hardhat getAllNetworks --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getNetworksCount
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getNetworksCount${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getNetworksCount - Valid call" \
    "npx hardhat getNetworksCount --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworksCount - Missing diamond parameter" \
    "npx hardhat getNetworksCount --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getNetworksPaginated
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getNetworksPaginated${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getNetworksPaginated - Valid parameters (page-index 0, page-size 10)" \
    "npx hardhat getNetworksPaginated --page-index 0 --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworksPaginated - Valid parameters (page-index 1, page-size 5)" \
    "npx hardhat getNetworksPaginated --page-index 1 --page-size 5 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworksPaginated - Missing page-index parameter" \
    "npx hardhat getNetworksPaginated --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getNetworksPaginated - Missing page-size parameter" \
    "npx hardhat getNetworksPaginated --page-index 0 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getNetworksPaginated - Invalid page-index (negative)" \
    "npx hardhat getNetworksPaginated --page-index -1 --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getNetworksPaginated - Invalid page-size (zero)" \
    "npx hardhat getNetworksPaginated --page-index 0 --page-size 0 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getNetworksByAlgorithm
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getNetworksByAlgorithm${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getNetworksByAlgorithm - Valid algorithm (SECP256K1)" \
    "npx hardhat getNetworksByAlgorithm --algorithm 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworksByAlgorithm - Valid algorithm (SECP256R1)" \
    "npx hardhat getNetworksByAlgorithm --algorithm 2 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworksByAlgorithm - Valid algorithm (NONE)" \
    "npx hardhat getNetworksByAlgorithm --algorithm 0 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworksByAlgorithm - Invalid algorithm (out of range)" \
    "npx hardhat getNetworksByAlgorithm --algorithm 99 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getNetworksByAlgorithm - Missing algorithm parameter" \
    "npx hardhat getNetworksByAlgorithm --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: setResource
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: setResource${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "setResource - Valid parameters (new resource)" \
    "npx hardhat setResource --chain-id ${TEST_CHAIN_ID} --resource-id 'API' --resource 'https://api.test.io' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "setResource - Valid parameters (update existing resource)" \
    "npx hardhat setResource --chain-id ${TEST_CHAIN_ID} --resource-id '${TEST_RESOURCE_ID}' --resource '${TEST_RESOURCE_VALUE}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "setResource - Missing chain-id parameter" \
    "npx hardhat setResource --resource-id 'RPC' --resource 'https://rpc.io' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "setResource - Missing resource-id parameter" \
    "npx hardhat setResource --chain-id ${TEST_CHAIN_ID} --resource 'https://rpc.io' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "setResource - Missing resource parameter" \
    "npx hardhat setResource --chain-id ${TEST_CHAIN_ID} --resource-id 'RPC' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "setResource - Non-existent chain ID" \
    "npx hardhat setResource --chain-id ${NONEXISTENT_CHAIN_ID} --resource-id 'RPC' --resource 'https://rpc.io' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getResourceKeys
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getResourceKeys${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getResourceKeys - Valid chain ID" \
    "npx hardhat getResourceKeys --chain-id ${TEST_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getResourceKeys - Non-existent chain ID" \
    "npx hardhat getResourceKeys --chain-id ${NONEXISTENT_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getResourceKeys - Missing chain-id parameter" \
    "npx hardhat getResourceKeys --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getResourceKeysPaginated
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getResourceKeysPaginated${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getResourceKeysPaginated - Valid parameters" \
    "npx hardhat getResourceKeysPaginated --chain-id ${TEST_CHAIN_ID} --page-index 0 --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getResourceKeysPaginated - Missing chain-id parameter" \
    "npx hardhat getResourceKeysPaginated --page-index 0 --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getResourceKeysPaginated - Missing page-index parameter" \
    "npx hardhat getResourceKeysPaginated --chain-id ${TEST_CHAIN_ID} --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getResourceKeysPaginated - Missing page-size parameter" \
    "npx hardhat getResourceKeysPaginated --chain-id ${TEST_CHAIN_ID} --page-index 0 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getResourceKeysPaginated - Invalid page-index (negative)" \
    "npx hardhat getResourceKeysPaginated --chain-id ${TEST_CHAIN_ID} --page-index -1 --page-size 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getResourceCount
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getResourceCount${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getResourceCount - Valid chain ID" \
    "npx hardhat getResourceCount --chain-id ${TEST_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getResourceCount - Non-existent chain ID" \
    "npx hardhat getResourceCount --chain-id ${NONEXISTENT_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getResourceCount - Missing chain-id parameter" \
    "npx hardhat getResourceCount --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: updateNetwork
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: updateNetwork${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "updateNetwork - Valid parameters" \
    "npx hardhat updateNetwork --chain-id ${TEST_CHAIN_ID} --name '${UPDATED_NETWORK_NAME}' --symbol '${UPDATED_NETWORK_SYMBOL}' --algorithm ${TEST_ALGORITHM} --stage ${UPDATED_STAGE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "updateNetwork - Non-existent chain ID" \
    "npx hardhat updateNetwork --chain-id ${NONEXISTENT_CHAIN_ID} --name 'Test' --symbol 'TST' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "updateNetwork - Missing chain-id parameter" \
    "npx hardhat updateNetwork --name 'Test' --symbol 'TST' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "updateNetwork - Missing name parameter" \
    "npx hardhat updateNetwork --chain-id ${TEST_CHAIN_ID} --symbol 'TST' --algorithm 1 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "updateNetwork - Invalid algorithm" \
    "npx hardhat updateNetwork --chain-id ${TEST_CHAIN_ID} --name 'Test' --symbol 'TST' --algorithm 99 --stage 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "updateNetwork - Invalid stage" \
    "npx hardhat updateNetwork --chain-id ${TEST_CHAIN_ID} --name 'Test' --symbol 'TST' --algorithm 1 --stage 99 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: deleteResource
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: deleteResource${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "deleteResource - Valid parameters (existing resource)" \
    "npx hardhat deleteResource --chain-id ${TEST_CHAIN_ID} --resource-id 'API' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "deleteResource - Non-existent resource" \
    "npx hardhat deleteResource --chain-id ${TEST_CHAIN_ID} --resource-id 'NONEXISTENT' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "deleteResource - Missing chain-id parameter" \
    "npx hardhat deleteResource --resource-id 'RPC' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "deleteResource - Missing resource-id parameter" \
    "npx hardhat deleteResource --chain-id ${TEST_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "deleteResource - Non-existent chain ID" \
    "npx hardhat deleteResource --chain-id ${NONEXISTENT_CHAIN_ID} --resource-id 'RPC' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: deleteNetwork
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: deleteNetwork${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "deleteNetwork - Valid chain ID" \
    "npx hardhat deleteNetwork --chain-id 2025 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "deleteNetwork - Non-existent chain ID" \
    "npx hardhat deleteNetwork --chain-id ${NONEXISTENT_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "deleteNetwork - Already deleted network (should fail)" \
    "npx hardhat deleteNetwork --chain-id 2025 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "deleteNetwork - Missing chain-id parameter" \
    "npx hardhat deleteNetwork --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "deleteNetwork - Delete main test network (final cleanup)" \
    "npx hardhat deleteNetwork --chain-id ${TEST_CHAIN_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

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

