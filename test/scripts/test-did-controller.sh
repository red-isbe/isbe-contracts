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
# DID Controller Facet Tasks Test Script
# ----------------------------------------
# This script tests all DID Controller tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# PREREQUISITES:
#   - The DID must already exist (created via insertFirstDidDocument)
#   - The controller DID must also exist
#   - The caller must have the appropriate permissions
#   - Run test-did-document.sh first to create test DIDs
#
# Usage:
#   ./test-did-controller.sh <network>
#
# Example:
#   ./test-did-controller.sh localhost
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
DIAMOND="${DIAMOND:-0x9d6cbA688433eB558e91D38061e05aD91fbEE940}"

# Test data - DIDs (bytes32 format)
TEST_DID="0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de"
TEST_DID_2="0x6e2ccccc89f87961923680b5c5738b0fbc537b6e3848492ca3d48ee483344eff"
TEST_CONTROLLER_DID="0x81937c3e4c9d61ee5f01777ce2e10e2c7f422e00c1b9ad614475f351a5df6919"
TEST_CONTROLLER_DID_2="0x72826b2d58d5bdb6924af86d5ef6c06b1d3a7d17382bcabc94e37ed572ce5828"
NONEXISTENT_DID="0x0000000000000000000000000000000000000000000000000000000000000001"
NONEXISTENT_CONTROLLER="0x0000000000000000000000000000000000000000000000000000000000000002"

# Test addresses for checkControllerByDid
TEST_ADDRESS="0x581fb771781AC39b5a6473ad9d423DaA841E1b21"
TEST_ADDRESS_2="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ZERO_ADDRESS="0x0000000000000000000000000000000000000000"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} DID Controller Facet Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test DID: ${TEST_DID}"
echo -e "Test Controller DID: ${TEST_CONTROLLER_DID}"
echo ""
echo -e "${YELLOW}⚠️  NOTE: Write operations require the DID to exist first.${NC}"
echo -e "${YELLOW}   Run test-did-document.sh first, or these tests will fail.${NC}"
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
# Test Suite: getDidsByController (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidsByController (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidsByController - Query DIDs for controller (empty state)" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByController - Query non-existent controller" \
    "npx hardhat getDidsByController --controller ${NONEXISTENT_CONTROLLER} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByController - Missing controller parameter" \
    "npx hardhat getDidsByController --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidsByController - Missing diamond parameter" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID} --page 0 --pagesize 10 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: checkControllerByDid (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: checkControllerByDid (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "checkControllerByDid - Check non-existent controller relationship" \
    "npx hardhat checkControllerByDid --did ${TEST_DID} --controller ${TEST_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "checkControllerByDid - Check with zero address controller" \
    "npx hardhat checkControllerByDid --did ${TEST_DID} --controller ${ZERO_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "checkControllerByDid - Missing did parameter" \
    "npx hardhat checkControllerByDid --controller ${TEST_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "checkControllerByDid - Missing controller parameter" \
    "npx hardhat checkControllerByDid --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "checkControllerByDid - Missing diamond parameter" \
    "npx hardhat checkControllerByDid --did ${TEST_DID} --controller ${TEST_ADDRESS} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: addController (Write Operations)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addController (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addController - Add first controller to DID" \
    "npx hardhat addController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addController - Add second controller to DID" \
    "npx hardhat addController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addController - Add controller to second DID" \
    "npx hardhat addController --did ${TEST_DID_2} --controller ${TEST_CONTROLLER_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addController - Missing did parameter" \
    "npx hardhat addController --controller ${TEST_CONTROLLER_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addController - Missing controller parameter" \
    "npx hardhat addController --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addController - Missing diamond parameter" \
    "npx hardhat addController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID} --network ${NETWORK}" \
    "false"

run_test \
    "addController - Duplicate controller (should fail - DidIsControlledBy)" \
    "npx hardhat addController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidsByController (After Adding)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidsByController (After Adding)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidsByController - Query DIDs controlled by first controller" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByController - Query DIDs controlled by second controller" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID_2} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByController - Pagination test page 0" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID} --page 0 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByController - Pagination test page 1" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID} --page 1 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: checkControllerByDid (After Adding)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: checkControllerByDid (After Adding)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "checkControllerByDid - Verify controller was added" \
    "npx hardhat checkControllerByDid --did ${TEST_DID} --controller ${TEST_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "checkControllerByDid - Check with different address" \
    "npx hardhat checkControllerByDid --did ${TEST_DID} --controller ${TEST_ADDRESS_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: revokeController (Write Operations)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: revokeController (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "revokeController - Revoke second controller from DID" \
    "npx hardhat revokeController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "revokeController - Missing did parameter" \
    "npx hardhat revokeController --controller ${TEST_CONTROLLER_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeController - Missing controller parameter" \
    "npx hardhat revokeController --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeController - Missing diamond parameter" \
    "npx hardhat revokeController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID} --network ${NETWORK}" \
    "false"

run_test \
    "revokeController - Non-existent controller (should fail - DidIsNotControlledBy)" \
    "npx hardhat revokeController --did ${TEST_DID} --controller ${NONEXISTENT_CONTROLLER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeController - Already revoked controller (should fail)" \
    "npx hardhat revokeController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeController - Last controller (should fail - CannotLeaveDidWithoutControllers)" \
    "npx hardhat revokeController --did ${TEST_DID} --controller ${TEST_CONTROLLER_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidsByController (After Revoke)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidsByController (After Revoke)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidsByController - Verify revoked controller has fewer DIDs" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID_2} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByController - Verify remaining controller still has DIDs" \
    "npx hardhat getDidsByController --controller ${TEST_CONTROLLER_DID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
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

