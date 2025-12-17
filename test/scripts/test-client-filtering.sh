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
# ClientFilteringFacet Tasks Test Script
# ----------------------------------------
# This script tests all ClientFiltering tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-client-filtering.sh <network>
#
# Example:
#   ./test-client-filtering.sh localhost
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
    echo "Example: $0 localhost"
    exit 1
fi

NETWORK="$1"

# Configuration
CLIENT_FILTERING_ADDRESS="${CLIENT_FILTERING_ADDRESS:-0x00000000000000000000000000000000000015BE}"

# Test data - Filter IDs (bytes32 format)
TEST_FILTER_ID="0x112dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e157"
TEST_FILTER_ID_2="0x222dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e222"
TEST_FILTER_ID_UPDATE="0x333dd723577b76611d03a5df6740ef34e4adf801a94538796f066cda9100e333"
NONEXISTENT_FILTER_ID="0x0000000000000000000000000000000000000000000000000000000000000001"

# Filter types:
# 0: NONE
# 1: TRANSACTION_HASH
# 2: CONTRACT
# 3: SIGNATURE
# 4: CONTRACT_AND_SIGNATURE
# 5: JSONRPC_METHOD

# Test data - addresses and hashes
TEST_CONTRACT_ADDRESS="0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
TEST_TRANSACTION_HASH="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TEST_SIGNATURE="0x01234567"
TEST_JSONRPC_METHOD="eth_storageAt"
ZERO_ADDRESS="0x0000000000000000000000000000000000000000"
ZERO_HASH="0x0000000000000000000000000000000000000000000000000000000000000000"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} ClientFilteringFacet Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Client Filtering Address: ${CLIENT_FILTERING_ADDRESS}"
echo -e "Test Filter ID: ${TEST_FILTER_ID}"
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
# Test Suite: getFiltersLength (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getFiltersLength (Initial)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getFiltersLength - Valid call (initial state)" \
    "npx hardhat getFiltersLength --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --network ${NETWORK}" \
    "true"

run_test \
    "getFiltersLength - Missing client-filtering-address parameter" \
    "npx hardhat getFiltersLength --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isFilterRegistered (Before Registration)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isFilterRegistered (Before Registration)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isFilterRegistered - Non-existent filter" \
    "npx hardhat isFilterRegistered --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${NONEXISTENT_FILTER_ID} --network ${NETWORK}" \
    "true"

run_test \
    "isFilterRegistered - Missing filter-id parameter" \
    "npx hardhat isFilterRegistered --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --network ${NETWORK}" \
    "true"  # Uses default ZeroHash

run_test \
    "isFilterRegistered - Missing client-filtering-address parameter" \
    "npx hardhat isFilterRegistered --filter-id ${TEST_FILTER_ID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getFiltersByPage (Before Registration)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getFiltersByPage (Before Registration)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getFiltersByPage - Valid call (empty state)" \
    "npx hardhat getFiltersByPage --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --page-number 0 --page-size 10 --network ${NETWORK}" \
    "true"

run_test \
    "getFiltersByPage - Missing page-number parameter (should use default)" \
    "npx hardhat getFiltersByPage --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --page-size 10 --network ${NETWORK}" \
    "true"

run_test \
    "getFiltersByPage - Missing client-filtering-address parameter" \
    "npx hardhat getFiltersByPage --page-number 0 --page-size 10 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: registerFilter
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: registerFilter${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "registerFilter - Type TRANSACTION_HASH (type 1)" \
    "npx hardhat registerFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID} --filter-type 1 --transaction-hash ${TEST_TRANSACTION_HASH} --contract-address ${ZERO_ADDRESS} --signature '0x00000000' --json-rpc-method '' --initial-block 0 --end-block 0 --disabled false --network ${NETWORK}" \
    "true"

run_test \
    "registerFilter - Type CONTRACT (type 2)" \
    "npx hardhat registerFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID_2} --filter-type 2 --transaction-hash ${ZERO_HASH} --contract-address ${TEST_CONTRACT_ADDRESS} --signature '0x00000000' --json-rpc-method '' --initial-block 0 --end-block 0 --disabled false --network ${NETWORK}" \
    "true"

run_test \
    "registerFilter - Type SIGNATURE (type 3)" \
    "npx hardhat registerFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID_UPDATE} --filter-type 3 --transaction-hash ${ZERO_HASH} --contract-address ${ZERO_ADDRESS} --signature ${TEST_SIGNATURE} --json-rpc-method '' --initial-block 0 --end-block 0 --disabled false --network ${NETWORK}" \
    "true"

run_test \
    "registerFilter - Missing filter-id parameter" \
    "npx hardhat registerFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-type 1 --transaction-hash ${TEST_TRANSACTION_HASH} --network ${NETWORK}" \
    "false"

run_test \
    "registerFilter - Missing client-filtering-address parameter" \
    "npx hardhat registerFilter --filter-id ${TEST_FILTER_ID} --filter-type 1 --transaction-hash ${TEST_TRANSACTION_HASH} --network ${NETWORK}" \
    "false"

run_test \
    "registerFilter - Duplicate filter-id (should fail)" \
    "npx hardhat registerFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID} --filter-type 1 --transaction-hash ${TEST_TRANSACTION_HASH} --contract-address ${ZERO_ADDRESS} --signature '0x00000000' --json-rpc-method '' --initial-block 0 --end-block 0 --disabled false --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isFilterRegistered (After Registration)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isFilterRegistered (After Registration)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isFilterRegistered - Existing filter" \
    "npx hardhat isFilterRegistered --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID} --network ${NETWORK}" \
    "true"

run_test \
    "isFilterRegistered - Second existing filter" \
    "npx hardhat isFilterRegistered --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID_2} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getFiltersLength (After Registration)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getFiltersLength (After Registration)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getFiltersLength - After registering filters" \
    "npx hardhat getFiltersLength --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getFiltersByPage (After Registration)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getFiltersByPage (After Registration)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getFiltersByPage - First page with registered filters" \
    "npx hardhat getFiltersByPage --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --page-number 0 --page-size 10 --network ${NETWORK}" \
    "true"

run_test \
    "getFiltersByPage - Small page size" \
    "npx hardhat getFiltersByPage --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --page-number 0 --page-size 1 --network ${NETWORK}" \
    "true"

run_test \
    "getFiltersByPage - Second page" \
    "npx hardhat getFiltersByPage --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --page-number 1 --page-size 1 --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: updateFilter
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: updateFilter${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "updateFilter - Change filter type to CONTRACT_AND_SIGNATURE (type 4)" \
    "npx hardhat updateFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID} --filter-type 4 --transaction-hash ${ZERO_HASH} --contract-address ${TEST_CONTRACT_ADDRESS} --signature ${TEST_SIGNATURE} --json-rpc-method '' --initial-block 0 --end-block 100 --disabled false --network ${NETWORK}" \
    "true"

run_test \
    "updateFilter - Disable filter" \
    "npx hardhat updateFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${TEST_FILTER_ID_2} --filter-type 2 --transaction-hash ${ZERO_HASH} --contract-address ${TEST_CONTRACT_ADDRESS} --signature '0x00000000' --json-rpc-method '' --initial-block 0 --end-block 0 --disabled true --network ${NETWORK}" \
    "true"

run_test \
    "updateFilter - Non-existent filter (should fail)" \
    "npx hardhat updateFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-id ${NONEXISTENT_FILTER_ID} --filter-type 1 --transaction-hash ${TEST_TRANSACTION_HASH} --contract-address ${ZERO_ADDRESS} --signature '0x00000000' --json-rpc-method '' --initial-block 0 --end-block 0 --disabled false --network ${NETWORK}" \
    "false"

run_test \
    "updateFilter - Missing filter-id parameter" \
    "npx hardhat updateFilter --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --filter-type 1 --network ${NETWORK}" \
    "false"

run_test \
    "updateFilter - Missing client-filtering-address parameter" \
    "npx hardhat updateFilter --filter-id ${TEST_FILTER_ID} --filter-type 1 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getFiltersByPage (After Updates)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getFiltersByPage (After Updates)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getFiltersByPage - Verify updates reflected" \
    "npx hardhat getFiltersByPage --client-filtering-address ${CLIENT_FILTERING_ADDRESS} --page-number 0 --page-size 10 --network ${NETWORK}" \
    "true"

# ============================================
# Summary
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}Failed: ${ERROR_COUNT}${NC}"
echo ""

if [[ ${ERROR_COUNT} -eq 0 ]]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi

