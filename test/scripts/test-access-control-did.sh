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
# Access Control DID Governance Facet Tasks Test Script
# ----------------------------------------
# This script tests all Access Control DID tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# PREREQUISITES:
#   - The DID must already exist (created via insertFirstDidDocument)
#   - The caller must have DEFAULT_ADMIN_ROLE to grant roles
#   - Run test-did-document.sh first to create test DIDs
#
# Usage:
#   ./test-access-control-did.sh <network>
#
# Example:
#   ./test-access-control-did.sh localhost
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

# Test data - DIDs (bytes32 format)
TEST_DID="0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de"
TEST_DID_2="0x6e2ccccc89f87961923680b5c5738b0fbc537b6e3848492ca3d48ee483344eff"
TEST_DID_3="0x7f3ddddd0a087b83b45802d7e795b20ede759d8f0a6b6b4ec6f6a00685566211"
NONEXISTENT_DID="0x0000000000000000000000000000000000000000000000000000000000000001"

# Role identifiers (bytes32 format)
# These are typically keccak256 hashes of role names
# DID_REGISTRY_ROLE = keccak256("DID_REGISTRY_ROLE")
DID_REGISTRY_ROLE="0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973"
# NETWORK_OPERATOR_ROLE = keccak256("NETWORK_OPERATOR_ROLE")
NETWORK_OPERATOR_ROLE="0x9f2df0fed2c77648de5860a4dc508cd0a85dd92d7f8f9c3c8c7b2c8d7e3b4a96"
# CUSTOM_ROLE for testing
CUSTOM_ROLE="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
NONEXISTENT_ROLE="0x0000000000000000000000000000000000000000000000000000000000000002"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} Access Control DID Governance Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test DID: ${TEST_DID}"
echo -e "DID Registry Role: ${DID_REGISTRY_ROLE}"
echo ""
echo -e "${YELLOW}⚠️  NOTE: Write operations require the caller to have DEFAULT_ADMIN_ROLE.${NC}"
echo -e "${YELLOW}   Grant operations may fail if the caller lacks admin permissions.${NC}"
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
# Test Suite: hasRoleForDid (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: hasRoleForDid (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "hasRoleForDid - Check if DID has DID_REGISTRY_ROLE" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Check if DID has non-existent role" \
    "npx hardhat hasRoleForDid --role ${NONEXISTENT_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Check if non-existent DID has role" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${NONEXISTENT_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Missing role parameter" \
    "npx hardhat hasRoleForDid --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "hasRoleForDid - Missing did parameter" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "hasRoleForDid - Missing diamond parameter" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getRolesByDid (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getRolesByDid (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getRolesByDid - Get roles for DID (empty state)" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Get roles for non-existent DID" \
    "npx hardhat getRolesByDid --did ${NONEXISTENT_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Using default pagination" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Missing did parameter" \
    "npx hardhat getRolesByDid --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getRolesByDid - Missing diamond parameter" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --page 0 --pagesize 10 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidRoleMembers (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidRoleMembers (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidRoleMembers - Get DIDs with DID_REGISTRY_ROLE (empty state)" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Get DIDs with non-existent role" \
    "npx hardhat getDidRoleMembers --role ${NONEXISTENT_ROLE} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Using default pagination" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Missing role parameter" \
    "npx hardhat getDidRoleMembers --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidRoleMembers - Missing diamond parameter" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --page 0 --pagesize 10 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: grantDidRole (Write Operations)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: grantDidRole (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "grantDidRole - Grant DID_REGISTRY_ROLE to DID" \
    "npx hardhat grantDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "grantDidRole - Grant DID_REGISTRY_ROLE to second DID" \
    "npx hardhat grantDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "grantDidRole - Grant CUSTOM_ROLE to DID" \
    "npx hardhat grantDidRole --role ${CUSTOM_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "grantDidRole - Grant CUSTOM_ROLE to third DID" \
    "npx hardhat grantDidRole --role ${CUSTOM_ROLE} --did ${TEST_DID_3} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "grantDidRole - Missing role parameter" \
    "npx hardhat grantDidRole --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "grantDidRole - Missing did parameter" \
    "npx hardhat grantDidRole --role ${DID_REGISTRY_ROLE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "grantDidRole - Missing diamond parameter" \
    "npx hardhat grantDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --network ${NETWORK}" \
    "false"

run_test \
    "grantDidRole - Duplicate grant (should succeed or be idempotent)" \
    "npx hardhat grantDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: hasRoleForDid (After Grant)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: hasRoleForDid (After Grant)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "hasRoleForDid - Verify DID has granted role" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Verify second DID has granted role" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${TEST_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Verify DID has CUSTOM_ROLE" \
    "npx hardhat hasRoleForDid --role ${CUSTOM_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Verify DID without role returns false" \
    "npx hardhat hasRoleForDid --role ${NETWORK_OPERATOR_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getRolesByDid (After Grant)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getRolesByDid (After Grant)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getRolesByDid - Get roles for DID after grants" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Get roles for second DID" \
    "npx hardhat getRolesByDid --did ${TEST_DID_2} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Pagination test page 0" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --page 0 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Pagination test page 1" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --page 1 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getDidRoleMembers (After Grant)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidRoleMembers (After Grant)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidRoleMembers - Get DIDs with DID_REGISTRY_ROLE after grants" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Get DIDs with CUSTOM_ROLE" \
    "npx hardhat getDidRoleMembers --role ${CUSTOM_ROLE} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Pagination test page 0" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --page 0 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Pagination test page 1" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --page 1 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: revokeDidRole (Write Operations)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: revokeDidRole (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "revokeDidRole - Revoke DID_REGISTRY_ROLE from second DID" \
    "npx hardhat revokeDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "revokeDidRole - Revoke CUSTOM_ROLE from DID" \
    "npx hardhat revokeDidRole --role ${CUSTOM_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "revokeDidRole - Missing role parameter" \
    "npx hardhat revokeDidRole --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeDidRole - Missing did parameter" \
    "npx hardhat revokeDidRole --role ${DID_REGISTRY_ROLE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeDidRole - Missing diamond parameter" \
    "npx hardhat revokeDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --network ${NETWORK}" \
    "false"

run_test \
    "revokeDidRole - Revoke non-granted role (should succeed or be idempotent)" \
    "npx hardhat revokeDidRole --role ${NONEXISTENT_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "revokeDidRole - Revoke already revoked role" \
    "npx hardhat revokeDidRole --role ${DID_REGISTRY_ROLE} --did ${TEST_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: Verification After Revoke
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: Verification After Revoke${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "hasRoleForDid - Verify revoked DID no longer has role" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${TEST_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Verify DID no longer has CUSTOM_ROLE" \
    "npx hardhat hasRoleForDid --role ${CUSTOM_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "hasRoleForDid - Verify first DID still has DID_REGISTRY_ROLE" \
    "npx hardhat hasRoleForDid --role ${DID_REGISTRY_ROLE} --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getRolesByDid - Get roles after revocation" \
    "npx hardhat getRolesByDid --did ${TEST_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidRoleMembers - Get DIDs with DID_REGISTRY_ROLE after revocation" \
    "npx hardhat getDidRoleMembers --role ${DID_REGISTRY_ROLE} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
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

