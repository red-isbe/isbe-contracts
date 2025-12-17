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
# DID Registry Query Facet Tasks Test Script
# ----------------------------------------
# This script tests all DID Registry Query tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-did-registry-query.sh <network>
#
# Example:
#   ./test-did-registry-query.sh localhost
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

# Test addresses
TEST_ACCOUNT="0x581fb771781AC39b5a6473ad9d423DaA841E1b21"
TEST_ACCOUNT_2="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
TEST_ACCOUNT_UNKNOWN="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
ZERO_ADDRESS="0x0000000000000000000000000000000000000000"
INVALID_ADDRESS="0xinvalid"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} DID Registry Query Facet Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test Account: ${TEST_ACCOUNT}"
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
# Test Suite: didOf (Read Operations)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: didOf (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "didOf - Query DID for test account" \
    "npx hardhat didOf --account ${TEST_ACCOUNT} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "didOf - Query DID for second account" \
    "npx hardhat didOf --account ${TEST_ACCOUNT_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "didOf - Query DID for unknown account" \
    "npx hardhat didOf --account ${TEST_ACCOUNT_UNKNOWN} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "didOf - Query DID for zero address" \
    "npx hardhat didOf --account ${ZERO_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "didOf - Missing account parameter" \
    "npx hardhat didOf --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "didOf - Missing diamond parameter" \
    "npx hardhat didOf --account ${TEST_ACCOUNT} --network ${NETWORK}" \
    "false"

run_test \
    "didOf - Invalid address format" \
    "npx hardhat didOf --account ${INVALID_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isKnownDid (Read Operations)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isKnownDid (Read Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isKnownDid - Check if test account has known DID" \
    "npx hardhat isKnownDid --account ${TEST_ACCOUNT} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isKnownDid - Check if second account has known DID" \
    "npx hardhat isKnownDid --account ${TEST_ACCOUNT_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isKnownDid - Check if unknown account has known DID" \
    "npx hardhat isKnownDid --account ${TEST_ACCOUNT_UNKNOWN} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isKnownDid - Check zero address" \
    "npx hardhat isKnownDid --account ${ZERO_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isKnownDid - Missing account parameter" \
    "npx hardhat isKnownDid --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "isKnownDid - Missing diamond parameter" \
    "npx hardhat isKnownDid --account ${TEST_ACCOUNT} --network ${NETWORK}" \
    "false"

run_test \
    "isKnownDid - Invalid address format" \
    "npx hardhat isKnownDid --account ${INVALID_ADDRESS} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: Multiple queries
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: Multiple Consecutive Queries${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "Multiple queries - didOf for multiple accounts" \
    "npx hardhat didOf --account ${TEST_ACCOUNT} --diamond ${DIAMOND} --network ${NETWORK} && \
     npx hardhat didOf --account ${TEST_ACCOUNT_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "Multiple queries - isKnownDid for multiple accounts" \
    "npx hardhat isKnownDid --account ${TEST_ACCOUNT} --diamond ${DIAMOND} --network ${NETWORK} && \
     npx hardhat isKnownDid --account ${TEST_ACCOUNT_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "Mixed queries - didOf and isKnownDid for same account" \
    "npx hardhat didOf --account ${TEST_ACCOUNT} --diamond ${DIAMOND} --network ${NETWORK} && \
     npx hardhat isKnownDid --account ${TEST_ACCOUNT} --diamond ${DIAMOND} --network ${NETWORK}" \
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

