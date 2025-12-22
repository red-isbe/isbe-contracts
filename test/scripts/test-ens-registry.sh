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
# ENS Registry Facet Tasks Test Script
# ----------------------------------------
# This script tests all ENS Registry tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-ens-registry.sh <network>
#
# Example:
#   ./test-ens-registry.sh localhost
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
DIAMOND="${DIAMOND:-0x00000000000000000000000000000000000015BE}"

# Test data - Node hashes (bytes32 format)
# Root node (0x0)
ROOT_NODE="0x0000000000000000000000000000000000000000000000000000000000000000"
# Test node for operations
TEST_NODE="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
# Subnode label hash
TEST_LABEL="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TEST_LABEL_2="0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
NONEXISTENT_NODE="0x9999999999999999999999999999999999999999999999999999999999999999"

# Test addresses
TEST_OWNER="0x581fb771781AC39b5a6473ad9d423DaA841E1b21"
TEST_OWNER_2="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
TEST_RESOLVER="0x1234567890123456789012345678901234567890"
TEST_OPERATOR="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
ZERO_ADDRESS="0x0000000000000000000000000000000000000000"

# TTL values
TEST_TTL=3600
TEST_TTL_UPDATED=7200

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} ENS Registry Facet Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Root Node: ${ROOT_NODE}"
echo -e "Test Node: ${TEST_NODE}"
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
# Test Suite: ensOwner (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensOwner (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensOwner - Root node owner" \
    "npx hardhat ensOwner --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensOwner - Non-existent node" \
    "npx hardhat ensOwner --node ${NONEXISTENT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensOwner - Missing node parameter" \
    "npx hardhat ensOwner --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensOwner - Missing diamond parameter" \
    "npx hardhat ensOwner --node ${ROOT_NODE} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensResolver (Read)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensResolver (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensResolver - Root node resolver" \
    "npx hardhat ensResolver --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensResolver - Non-existent node" \
    "npx hardhat ensResolver --node ${NONEXISTENT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensResolver - Missing node parameter" \
    "npx hardhat ensResolver --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensTtl (Read)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensTtl (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensTtl - Root node TTL" \
    "npx hardhat ensTtl --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensTtl - Non-existent node" \
    "npx hardhat ensTtl --node ${NONEXISTENT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensTtl - Missing node parameter" \
    "npx hardhat ensTtl --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensRecordExists (Read)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensRecordExists (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensRecordExists - Root node" \
    "npx hardhat ensRecordExists --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensRecordExists - Non-existent node" \
    "npx hardhat ensRecordExists --node ${NONEXISTENT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensRecordExists - Missing node parameter" \
    "npx hardhat ensRecordExists --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensIsApprovedForAll (Read)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensIsApprovedForAll (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensIsApprovedForAll - Check approval status" \
    "npx hardhat ensIsApprovedForAll --owner ${TEST_OWNER} --operator ${TEST_OPERATOR} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensIsApprovedForAll - Missing owner parameter" \
    "npx hardhat ensIsApprovedForAll --operator ${TEST_OPERATOR} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensIsApprovedForAll - Missing operator parameter" \
    "npx hardhat ensIsApprovedForAll --owner ${TEST_OWNER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetSubnodeOwner (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetSubnodeOwner (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetSubnodeOwner - Create subnode from root" \
    "npx hardhat ensSetSubnodeOwner --node ${ROOT_NODE} --label ${TEST_LABEL} --owner ${TEST_OWNER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetSubnodeOwner - Create second subnode" \
    "npx hardhat ensSetSubnodeOwner --node ${ROOT_NODE} --label ${TEST_LABEL_2} --owner ${TEST_OWNER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetSubnodeOwner - Missing node parameter" \
    "npx hardhat ensSetSubnodeOwner --label ${TEST_LABEL} --owner ${TEST_OWNER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetSubnodeOwner - Missing label parameter" \
    "npx hardhat ensSetSubnodeOwner --node ${ROOT_NODE} --owner ${TEST_OWNER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetSubnodeOwner - Missing owner parameter" \
    "npx hardhat ensSetSubnodeOwner --node ${ROOT_NODE} --label ${TEST_LABEL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetSubnodeRecord (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetSubnodeRecord (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetSubnodeRecord - Create subnode with full record" \
    "npx hardhat ensSetSubnodeRecord --node ${ROOT_NODE} --label ${TEST_LABEL} --owner ${TEST_OWNER} --resolver ${TEST_RESOLVER} --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetSubnodeRecord - Missing resolver parameter" \
    "npx hardhat ensSetSubnodeRecord --node ${ROOT_NODE} --label ${TEST_LABEL} --owner ${TEST_OWNER} --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetSubnodeRecord - Missing ttl parameter" \
    "npx hardhat ensSetSubnodeRecord --node ${ROOT_NODE} --label ${TEST_LABEL} --owner ${TEST_OWNER} --resolver ${TEST_RESOLVER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetOwner (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetOwner (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetOwner - Transfer root node ownership" \
    "npx hardhat ensSetOwner --node ${ROOT_NODE} --owner ${TEST_OWNER_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetOwner - Missing node parameter" \
    "npx hardhat ensSetOwner --owner ${TEST_OWNER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetOwner - Missing owner parameter" \
    "npx hardhat ensSetOwner --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetResolver (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetResolver (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetResolver - Set resolver for root node" \
    "npx hardhat ensSetResolver --node ${ROOT_NODE} --resolver ${TEST_RESOLVER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetResolver - Missing node parameter" \
    "npx hardhat ensSetResolver --resolver ${TEST_RESOLVER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetResolver - Missing resolver parameter" \
    "npx hardhat ensSetResolver --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetTTL (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetTTL (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetTTL - Set TTL for root node" \
    "npx hardhat ensSetTTL --node ${ROOT_NODE} --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetTTL - Update TTL" \
    "npx hardhat ensSetTTL --node ${ROOT_NODE} --ttl ${TEST_TTL_UPDATED} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetTTL - Missing node parameter" \
    "npx hardhat ensSetTTL --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetTTL - Missing ttl parameter" \
    "npx hardhat ensSetTTL --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetRecord (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetRecord (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetRecord - Set complete record for root node" \
    "npx hardhat ensSetRecord --node ${ROOT_NODE} --owner ${TEST_OWNER} --resolver ${TEST_RESOLVER} --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetRecord - Missing owner parameter" \
    "npx hardhat ensSetRecord --node ${ROOT_NODE} --resolver ${TEST_RESOLVER} --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetRecord - Missing resolver parameter" \
    "npx hardhat ensSetRecord --node ${ROOT_NODE} --owner ${TEST_OWNER} --ttl ${TEST_TTL} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetRecord - Missing ttl parameter" \
    "npx hardhat ensSetRecord --node ${ROOT_NODE} --owner ${TEST_OWNER} --resolver ${TEST_RESOLVER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: ensSetApprovalForAll (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: ensSetApprovalForAll (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensSetApprovalForAll - Grant approval" \
    "npx hardhat ensSetApprovalForAll --operator ${TEST_OPERATOR} --approved true --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetApprovalForAll - Revoke approval" \
    "npx hardhat ensSetApprovalForAll --operator ${TEST_OPERATOR} --approved false --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensSetApprovalForAll - Missing operator parameter" \
    "npx hardhat ensSetApprovalForAll --approved true --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "ensSetApprovalForAll - Missing approved parameter" \
    "npx hardhat ensSetApprovalForAll --operator ${TEST_OPERATOR} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: Verification After All Operations
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: Verification After Operations${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "ensOwner - Verify updated owner" \
    "npx hardhat ensOwner --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensResolver - Verify resolver set" \
    "npx hardhat ensResolver --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensTtl - Verify TTL set" \
    "npx hardhat ensTtl --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensRecordExists - Verify record exists" \
    "npx hardhat ensRecordExists --node ${ROOT_NODE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "ensIsApprovedForAll - Verify approval revoked" \
    "npx hardhat ensIsApprovedForAll --owner ${TEST_OWNER} --operator ${TEST_OPERATOR} --diamond ${DIAMOND} --network ${NETWORK}" \
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

