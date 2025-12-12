#!/usr/bin/env bash

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
set -euo pipefail

# ----------------------------------------
# AnchoringCoreFacet Tasks Test Script
# ----------------------------------------
# This script tests all AnchoringCoreFacet tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-anchor-core.sh <network>
#
# Example:
#   ./test-anchor-core.sh genesis_validation_network_k1
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
GOVERNANCE_DIAMOND="${GOVERNANCE_DIAMOND:-0x00000000000000000000000000000000000015BE}"
CHAIN_ID="${CHAIN_ID:-1}"
VALID_BLOCK_NUMBER="${VALID_BLOCK_NUMBER:-100}"
VALID_BLOCK_HASH="${VALID_BLOCK_HASH:-0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"
VALID_STATE_ROOT="${VALID_STATE_ROOT:-0x1111111111111111111111111111111111111111111111111111111111111111}"
INVALID_CHAIN_ID="999999"
INVALID_BLOCK_NUMBER="999999999"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} AnchoringCoreFacet Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Governance Diamond: ${GOVERNANCE_DIAMOND}"
echo -e "Chain ID: ${CHAIN_ID}"
echo -e "Valid Block Number: ${VALID_BLOCK_NUMBER}"
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
# Test Suite: registerChain
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: registerChain${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "registerChain - Valid Chain ID" \
    "npx hardhat anchoringcorefacet:registerchain --chainid ${CHAIN_ID} --network ${NETWORK}" \
    "true"

run_test \
    "registerChain - Duplicate Chain ID (should fail)" \
    "npx hardhat anchoringcorefacet:registerchain --chainid ${CHAIN_ID} --network ${NETWORK}" \
    "false"

run_test \
    "registerChain - Missing chainid parameter" \
    "npx hardhat anchoringcorefacet:registerchain --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getChainMetadata
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getChainMetadata${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getChainMetadata - Get chain metadata" \
    "npx hardhat anchoringcorefacet:getchainmetadata --network ${NETWORK}" \
    "true"

run_test \
    "getChainMetadata - With explicit governance diamond" \
    "npx hardhat anchoringcorefacet:getchainmetadata --governancediamond ${GOVERNANCE_DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getRegisteredChains
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getRegisteredChains${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getRegisteredChains - Valid pagination (page 0, length 10)" \
    "npx hardhat anchoringcorefacet:getregisteredchains --pageindex 0 --pagelength 10 --network ${NETWORK}" \
    "true"

run_test \
    "getRegisteredChains - Valid pagination (page 1, length 5)" \
    "npx hardhat anchoringcorefacet:getregisteredchains --pageindex 1 --pagelength 5 --network ${NETWORK}" \
    "true"

run_test \
    "getRegisteredChains - Missing pageindex parameter" \
    "npx hardhat anchoringcorefacet:getregisteredchains --pagelength 10 --network ${NETWORK}" \
    "false"

run_test \
    "getRegisteredChains - Missing pagelength parameter" \
    "npx hardhat anchoringcorefacet:getregisteredchains --pageindex 0 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: anchorBlock
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: anchorBlock${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "anchorBlock - Valid block data" \
    "npx hardhat anchoringcorefacet:anchorblock --chainid ${CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --blockhash ${VALID_BLOCK_HASH} --stateroot ${VALID_STATE_ROOT} --network ${NETWORK}" \
    "true"

run_test \
    "anchorBlock - Duplicate block (should fail)" \
    "npx hardhat anchoringcorefacet:anchorblock --chainid ${CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --blockhash ${VALID_BLOCK_HASH} --stateroot ${VALID_STATE_ROOT} --network ${NETWORK}" \
    "false"

run_test \
    "anchorBlock - Missing blocknumber parameter" \
    "npx hardhat anchoringcorefacet:anchorblock --chainid ${CHAIN_ID} --blockhash ${VALID_BLOCK_HASH} --stateroot ${VALID_STATE_ROOT} --network ${NETWORK}" \
    "false"

run_test \
    "anchorBlock - Missing blockhash parameter" \
    "npx hardhat anchoringcorefacet:anchorblock --chainid ${CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --stateroot ${VALID_STATE_ROOT} --network ${NETWORK}" \
    "false"

run_test \
    "anchorBlock - Unregistered chain ID (should fail)" \
    "npx hardhat anchoringcorefacet:anchorblock --chainid ${INVALID_CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --blockhash ${VALID_BLOCK_HASH} --stateroot ${VALID_STATE_ROOT} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: anchorBlocksBatch
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: anchorBlocksBatch${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "anchorBlocksBatch - Valid batch (3 blocks)" \
    "npx hardhat anchoringcorefacet:anchorblocksbatch --chainid ${CHAIN_ID} --blocknumbers '101,102,103' --blockhashes '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb,0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc,0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' --stateroots '0x2222222222222222222222222222222222222222222222222222222222222222,0x3333333333333333333333333333333333333333333333333333333333333333,0x4444444444444444444444444444444444444444444444444444444444444444' --network ${NETWORK}" \
    "true"

run_test \
    "anchorBlocksBatch - Mismatched array lengths (should fail)" \
    "npx hardhat anchoringcorefacet:anchorblocksbatch --chainid ${CHAIN_ID} --blocknumbers '104,105' --blockhashes '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' --stateroots '0x5555555555555555555555555555555555555555555555555555555555555555,0x6666666666666666666666666666666666666666666666666666666666666666' --network ${NETWORK}" \
    "false"

run_test \
    "anchorBlocksBatch - Missing blocknumbers parameter" \
    "npx hardhat anchoringcorefacet:anchorblocksbatch --chainid ${CHAIN_ID} --blockhashes '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' --stateroots '0x5555555555555555555555555555555555555555555555555555555555555555' --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isBlockAnchored
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isBlockAnchored${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isBlockAnchored - Check anchored block (should be true)" \
    "npx hardhat anchoringcorefacet:isblockanchored --chainid ${CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --network ${NETWORK}" \
    "true"

run_test \
    "isBlockAnchored - Check non-anchored block (should be false)" \
    "npx hardhat anchoringcorefacet:isblockanchored --chainid ${CHAIN_ID} --blocknumber ${INVALID_BLOCK_NUMBER} --network ${NETWORK}" \
    "true"

run_test \
    "isBlockAnchored - Unregistered chain ID" \
    "npx hardhat anchoringcorefacet:isblockanchored --chainid ${INVALID_CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --network ${NETWORK}" \
    "true"

run_test \
    "isBlockAnchored - Missing blocknumber parameter" \
    "npx hardhat anchoringcorefacet:isblockanchored --chainid ${CHAIN_ID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getAnchoredBlock
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getAnchoredBlock${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getAnchoredBlock - Get valid anchored block" \
    "npx hardhat anchoringcorefacet:getanchoredblock --chainid ${CHAIN_ID} --blocknumber ${VALID_BLOCK_NUMBER} --network ${NETWORK}" \
    "true"

run_test \
    "getAnchoredBlock - Missing chainid parameter" \
    "npx hardhat anchoringcorefacet:getanchoredblock --blocknumber ${VALID_BLOCK_NUMBER} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getLastAnchoredBlock
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getLastAnchoredBlock${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getLastAnchoredBlock - Get last anchored block" \
    "npx hardhat anchoringcorefacet:getlastanchoredblock --chainid ${CHAIN_ID} --network ${NETWORK}" \
    "true"

run_test \
    "getLastAnchoredBlock - Missing chainid parameter" \
    "npx hardhat anchoringcorefacet:getlastanchoredblock --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getAnchoringStats
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getAnchoringStats${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getAnchoringStats - Get stats for valid chain" \
    "npx hardhat anchoringcorefacet:getanchoringstats --chainid ${CHAIN_ID} --network ${NETWORK}" \
    "true"

run_test \
    "getAnchoringStats - Unregistered chain ID (should return zero stats)" \
    "npx hardhat anchoringcorefacet:getanchoringstats --chainid ${INVALID_CHAIN_ID} --network ${NETWORK}" \
    "true"

run_test \
    "getAnchoringStats - Missing chainid parameter" \
    "npx hardhat anchoringcorefacet:getanchoringstats --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getBlocksInRange
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getBlocksInRange${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getBlocksInRange - Valid range (100-103)" \
    "npx hardhat anchoringcorefacet:getblocksinrange --chainid ${CHAIN_ID} --fromblock 100 --toblock 103 --network ${NETWORK}" \
    "true"

run_test \
    "getBlocksInRange - Empty range (no blocks)" \
    "npx hardhat anchoringcorefacet:getblocksinrange --chainid ${CHAIN_ID} --fromblock 200 --toblock 205 --network ${NETWORK}" \
    "true"

run_test \
    "getBlocksInRange - Missing fromblock parameter" \
    "npx hardhat anchoringcorefacet:getblocksinrange --chainid ${CHAIN_ID} --toblock 103 --network ${NETWORK}" \
    "false"

run_test \
    "getBlocksInRange - Missing toblock parameter" \
    "npx hardhat anchoringcorefacet:getblocksinrange --chainid ${CHAIN_ID} --fromblock 100 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getLastNBlocks
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getLastNBlocks${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getLastNBlocks - Get last 5 blocks" \
    "npx hardhat anchoringcorefacet:getlastnblocks --chainid ${CHAIN_ID} --count 5 --network ${NETWORK}" \
    "true"

run_test \
    "getLastNBlocks - Get last 1 block" \
    "npx hardhat anchoringcorefacet:getlastnblocks --chainid ${CHAIN_ID} --count 1 --network ${NETWORK}" \
    "true"

run_test \
    "getLastNBlocks - Get last 0 blocks (empty result)" \
    "npx hardhat anchoringcorefacet:getlastnblocks --chainid ${CHAIN_ID} --count 0 --network ${NETWORK}" \
    "true"

run_test \
    "getLastNBlocks - Unregistered chain ID" \
    "npx hardhat anchoringcorefacet:getlastnblocks --chainid ${INVALID_CHAIN_ID} --count 5 --network ${NETWORK}" \
    "true"

run_test \
    "getLastNBlocks - Missing count parameter" \
    "npx hardhat anchoringcorefacet:getlastnblocks --chainid ${CHAIN_ID} --network ${NETWORK}" \
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
