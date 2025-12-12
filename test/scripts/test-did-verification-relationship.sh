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
# DID Verification Relationship Facet Tasks Test Script
# ----------------------------------------
# This script tests all DID Verification Relationship tasks with both valid 
# and invalid inputs to verify error handling and success scenarios.
#
# PREREQUISITES:
#   - The DID must already exist (created via insertFirstDidDocument)
#   - The verification method must exist (created via addVerificationMethod)
#   - Run test-did-document.sh and test-did-verification-method.sh first
#
# Usage:
#   ./test-did-verification-relationship.sh <network>
#
# Example:
#   ./test-did-verification-relationship.sh localhost
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

# Test data - DID and Verification Method IDs (bytes32 format)
TEST_DID="0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de"
TEST_DID_2="0x6e2ccccc89f87961923680b5c5738b0fbc537b6e3848492ca3d48ee483344eff"
TEST_VMETHOD_ID="0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
TEST_VMETHOD_ID_2="0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
TEST_VMETHOD_ID_3="0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
NONEXISTENT_DID="0x0000000000000000000000000000000000000000000000000000000000000001"
NONEXISTENT_VMETHOD="0x0000000000000000000000000000000000000000000000000000000000000002"

# Valid relationship names as per DID spec
# authentication | assertionMethod | keyAgreement | capabilityInvocation | capabilityDelegation
RELATIONSHIP_AUTHENTICATION="authentication"
RELATIONSHIP_ASSERTION="assertionMethod"
RELATIONSHIP_KEY_AGREEMENT="keyAgreement"
RELATIONSHIP_CAP_INVOCATION="capabilityInvocation"
RELATIONSHIP_CAP_DELEGATION="capabilityDelegation"
INVALID_RELATIONSHIP="invalidRelationship"

# Timestamps (notBefore must be <= now, notAfter must be > notBefore)
CURRENT_TIME=$(date +%s)
NOTBEFORE=$CURRENT_TIME
NOTAFTER=$((CURRENT_TIME + 2592000))  # 30 days from now
NOTAFTER_LONG=$((CURRENT_TIME + 31536000))  # 1 year from now
INVALID_NOTAFTER=$((CURRENT_TIME - 86400))  # Yesterday (invalid for new relationship)

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} DID Verification Relationship Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test DID: ${TEST_DID}"
echo -e "Test VMethod ID: ${TEST_VMETHOD_ID}"
echo -e "NotBefore: ${NOTBEFORE}"
echo -e "NotAfter: ${NOTAFTER}"
echo ""
echo -e "${YELLOW}⚠️  NOTE: Write operations require the DID and verification method to exist.${NC}"
echo -e "${YELLOW}   Run test-did-document.sh and test-did-verification-method.sh first.${NC}"
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
# Test Suite: getDidsByVerificationRelationship (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidsByVerificationRelationship (Initial)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidsByVerificationRelationship - Query authentication relationships (empty state)" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_AUTHENTICATION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Query assertionMethod relationships" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_ASSERTION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Query non-existent verification method" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${NONEXISTENT_VMETHOD} --name ${RELATIONSHIP_AUTHENTICATION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Missing vmethodid parameter" \
    "npx hardhat getDidsByVerificationRelationship --name ${RELATIONSHIP_AUTHENTICATION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidsByVerificationRelationship - Missing name parameter" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidsByVerificationRelationship - Missing diamond parameter" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_AUTHENTICATION} --page 0 --pagesize 10 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: addVerificationRelationship (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addVerificationRelationship (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addVerificationRelationship - Add authentication relationship" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_AUTHENTICATION} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationRelationship - Add assertionMethod relationship" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_ASSERTION} --vmethodid ${TEST_VMETHOD_ID_2} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationRelationship - Add keyAgreement relationship" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID_2} --name ${RELATIONSHIP_KEY_AGREEMENT} --vmethodid ${TEST_VMETHOD_ID_3} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER_LONG} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationRelationship - Add capabilityInvocation relationship" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_CAP_INVOCATION} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationRelationship - Add capabilityDelegation relationship" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID_2} --name ${RELATIONSHIP_CAP_DELEGATION} --vmethodid ${TEST_VMETHOD_ID_2} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationRelationship - Missing did parameter" \
    "npx hardhat addVerificationRelationship --name ${RELATIONSHIP_AUTHENTICATION} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationRelationship - Missing name parameter" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationRelationship - Missing vmethodid parameter" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_AUTHENTICATION} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationRelationship - Missing notbefore parameter" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_AUTHENTICATION} --vmethodid ${TEST_VMETHOD_ID} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationRelationship - Missing notafter parameter" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_AUTHENTICATION} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationRelationship - Missing diamond parameter" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_AUTHENTICATION} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationRelationship - Duplicate relationship (should fail)" \
    "npx hardhat addVerificationRelationship --did ${TEST_DID} --name ${RELATIONSHIP_AUTHENTICATION} --vmethodid ${TEST_VMETHOD_ID} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidsByVerificationRelationship (After Adding)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidsByVerificationRelationship (After Adding)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidsByVerificationRelationship - Query authentication after adding" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_AUTHENTICATION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Query assertionMethod after adding" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID_2} --name ${RELATIONSHIP_ASSERTION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Query keyAgreement after adding" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID_3} --name ${RELATIONSHIP_KEY_AGREEMENT} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Pagination test page 0" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_AUTHENTICATION} --page 0 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - Pagination test page 1" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_AUTHENTICATION} --page 1 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidsByVerificationRelationship - All relationship types query" \
    "npx hardhat getDidsByVerificationRelationship --vmethodid ${TEST_VMETHOD_ID} --name ${RELATIONSHIP_CAP_INVOCATION} --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
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

