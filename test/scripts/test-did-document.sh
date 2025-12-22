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
# DID Document (Detailed) Facet Tasks Test Script
# ----------------------------------------
# This script tests all DID Document tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-did-document.sh <network>
#
# Example:
#   ./test-did-document.sh localhost
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
TEST_DID_NEW="0x7f3eeeee9af98a72a34791c6d684a1fcd648c7f4959a5a3db5e59ff594455100"
NONEXISTENT_DID="0x0000000000000000000000000000000000000000000000000000000000000001"

# Verification Method IDs (bytes32 format)
TEST_VMETHOD_ID="0x81937c3e4c9d61ee5f01777ce2e10e2c7f422e00c1b9ad614475f351a5df6919"

# Public keys (uncompressed format 65 bytes - 0x04 + 64 bytes)
TEST_PUBLIC_KEY="0x042b6d0db1e37fb2614a8eae290c70b00f2f54ab5368585d98b05a3d5af38e99fe46a7caabae4792260eb498db844dddfcfd214c48395f87ac4cbfc636f1a3de4f"

# Proof signature
TEST_PROOF="0x9311bce9a64f00c75082aab0b06f814e4b955d593991e029d4c5db245d122c3f025602b7292867ffa49c74b5d9c72077e08fd392124236d93b81914f3d6e3a3e1b"

# Elliptic curve types
ELLIPTIC_SECP256K1=1
ELLIPTIC_SECP256R1=2

# Timestamps
CURRENT_TIME=$(date +%s)
NOTBEFORE=$CURRENT_TIME
NOTAFTER=$((CURRENT_TIME + 31536000))  # 1 year from now
HISTORICAL_TIMESTAMP=$((CURRENT_TIME - 86400))  # Yesterday

# Base document (JSON-LD format)
TEST_BASE_DOCUMENT='{"@context":"https://www.w3.org/ns/did/v1","id":"did:alastria:test00001"}'
TEST_BASE_DOCUMENT_2='{"@context":"https://www.w3.org/ns/did/v1","id":"did:alastria:test00002"}'

# Also Known As
TEST_ALSO_KNOWN_AS="irn:orgs:alastria"
TEST_ALSO_KNOWN_AS_2="irn:orgs:alastria:test"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} DID Document Facet Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test DID: ${TEST_DID}"
echo -e "Test VMethod ID: ${TEST_VMETHOD_ID}"
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
echo "Initializing DID Registry for testing..."
npx hardhat didDocument:initializeDiDRegistry \
  --diamond 0x00000000000000000000000000000000000015BE \
  --elliptictype 1 \
  --network "${NETWORK}"
echo "DID Registry initialized."


# ============================================
# Test Suite: didDocument:getNetworkEllipticType
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getNetworkEllipticType${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getNetworkEllipticType - Get configured elliptic type" \
    "npx hardhat didDocument:getNetworkEllipticType --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getNetworkEllipticType - Missing diamond parameter" \
    "npx hardhat didDocument:getNetworkEllipticType --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDids (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDids (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDids - Get paginated list of DIDs (initial state)" \
    "npx hardhat getDids --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDids - Using default pagination values" \
    "npx hardhat getDids --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDids - Missing diamond parameter" \
    "npx hardhat getDids --page 0 --pagesize 10 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidDocument (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidDocument (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidDocument - Query non-existent DID" \
    "npx hardhat getDidDocument --did ${NONEXISTENT_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidDocument - Missing did parameter" \
    "npx hardhat getDidDocument --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidDocument - Missing diamond parameter" \
    "npx hardhat getDidDocument --did ${TEST_DID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidDocumentByTimestamp (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidDocumentByTimestamp (Initial State)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidDocumentByTimestamp - Query non-existent DID at timestamp" \
    "npx hardhat getDidDocumentByTimestamp --did ${NONEXISTENT_DID} --timestamp ${HISTORICAL_TIMESTAMP} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidDocumentByTimestamp - Missing did parameter" \
    "npx hardhat getDidDocumentByTimestamp --timestamp ${HISTORICAL_TIMESTAMP} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidDocumentByTimestamp - Missing timestamp parameter" \
    "npx hardhat getDidDocumentByTimestamp --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getDidDocumentByTimestamp - Missing diamond parameter" \
    "npx hardhat getDidDocumentByTimestamp --did ${TEST_DID} --timestamp ${HISTORICAL_TIMESTAMP} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: insertFirstDidDocument (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: insertFirstDidDocument (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "insertFirstDidDocument - Insert first DID document" \
    "npx hardhat insertFirstDidDocument --did ${TEST_DID} --basedocument '${TEST_BASE_DOCUMENT}' --vmethodid ${TEST_VMETHOD_ID} --proof ${TEST_PROOF} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --alsoknownas '${TEST_ALSO_KNOWN_AS}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "insertFirstDidDocument - Insert second DID document" \
    "npx hardhat insertFirstDidDocument --did ${TEST_DID_NEW} --basedocument '${TEST_BASE_DOCUMENT_2}' --vmethodid ${TEST_VMETHOD_ID} --proof ${TEST_PROOF} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --alsoknownas '${TEST_ALSO_KNOWN_AS}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "insertFirstDidDocument - Missing did parameter" \
    "npx hardhat insertFirstDidDocument --basedocument '${TEST_BASE_DOCUMENT}' --vmethodid ${TEST_VMETHOD_ID} --proof ${TEST_PROOF} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --alsoknownas '${TEST_ALSO_KNOWN_AS}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "insertFirstDidDocument - Missing basedocument parameter" \
    "npx hardhat insertFirstDidDocument --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --proof ${TEST_PROOF} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --alsoknownas '${TEST_ALSO_KNOWN_AS}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "insertFirstDidDocument - Missing vmethodid parameter" \
    "npx hardhat insertFirstDidDocument --did ${TEST_DID} --basedocument '${TEST_BASE_DOCUMENT}' --proof ${TEST_PROOF} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --alsoknownas '${TEST_ALSO_KNOWN_AS}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "insertFirstDidDocument - Duplicate DID (should fail)" \
    "npx hardhat insertFirstDidDocument --did ${TEST_DID} --basedocument '${TEST_BASE_DOCUMENT}' --vmethodid ${TEST_VMETHOD_ID} --proof ${TEST_PROOF} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER} --alsoknownas '${TEST_ALSO_KNOWN_AS}' --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getDidDocument (After Insert)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidDocument (After Insert)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidDocument - Query existing DID" \
    "npx hardhat getDidDocument --did ${TEST_DID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidDocument - Query second existing DID" \
    "npx hardhat getDidDocument --did ${TEST_DID_NEW} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getDids (After Insert)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDids (After Insert)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDids - Get paginated list after inserts" \
    "npx hardhat getDids --page 0 --pagesize 10 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDids - Pagination test page 0 size 1" \
    "npx hardhat getDids --page 0 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDids - Pagination test page 1 size 1" \
    "npx hardhat getDids --page 1 --pagesize 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getDidDocumentByTimestamp (After Insert)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getDidDocumentByTimestamp (After Insert)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getDidDocumentByTimestamp - Query existing DID at current timestamp" \
    "npx hardhat getDidDocumentByTimestamp --did ${TEST_DID} --timestamp ${CURRENT_TIME} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getDidDocumentByTimestamp - Query existing DID at future timestamp" \
    "npx hardhat getDidDocumentByTimestamp --did ${TEST_DID} --timestamp ${NOTAFTER} --diamond ${DIAMOND} --network ${NETWORK}" \
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

