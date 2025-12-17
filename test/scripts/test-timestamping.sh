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
# TimeStamping Tasks Test Script
# ----------------------------------------
# This script tests all TimeStamping tasks with both valid and invalid inputs
# to verify error handling and success scenarios.
#
# Usage:
#   ./test-timestamping.sh <network>
#
# Example:
#   ./test-timestamping.sh localhost
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

# Test hashes (valid bytes32 format)
TEST_ORIGINAL_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
TEST_TSA_HASH="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TEST_EXTERNAL_REF_ID="0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"

# Second set of hashes for additional tests
TEST_ORIGINAL_HASH_2="0x2234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde2"
TEST_TSA_HASH_2="0xbbcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789b"
TEST_EXTERNAL_REF_ID_2="0xeedcba0987654321fedcba0987654321fedcba0987654321fedcba098765432e"

# Invalid hashes for error testing
INVALID_HASH_SHORT="0x1234"
INVALID_HASH_NOT_HEX="0xGGGGGGGG1234567890abcdef1234567890abcdef1234567890abcdef12345678"
NONEXISTENT_HASH="0x0000000000000000000000000000000000000000000000000000000000000001"

# Signature test values
TEST_SENDER="0x581fb771781AC39b5a6473ad9d423DaA841E1b21"
TEST_EXPIRATION_TIMESTAMP=1893456000  # Far future timestamp (2030)
TEST_NONCE=1
TEST_SIGNATURE="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab1c"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} TimeStamping Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test Original Hash: ${TEST_ORIGINAL_HASH}"
echo -e "Test TSA Hash: ${TEST_TSA_HASH}"
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
# Test Suite: getStampedSize (Initial State)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getStampedSize (Initial)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getStampedSize - Valid call (initial state)" \
    "npx hardhat getStampedSize --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getStampedSize - Missing diamond parameter" \
    "npx hardhat getStampedSize --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isOriginalHashRegistered (Before Stamp)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isOriginalHashRegistered (Before Stamp)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isOriginalHashRegistered - Non-existent hash" \
    "npx hardhat isOriginalHashRegistered --original-hash ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isOriginalHashRegistered - Missing original-hash parameter" \
    "npx hardhat isOriginalHashRegistered --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "isOriginalHashRegistered - Missing diamond parameter" \
    "npx hardhat isOriginalHashRegistered --original-hash ${TEST_ORIGINAL_HASH} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isTsaHashRegistered (Before Stamp)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isTsaHashRegistered (Before Stamp)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isTsaHashRegistered - Non-existent hash" \
    "npx hardhat isTsaHashRegistered --tsa-hash ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isTsaHashRegistered - Missing tsa-hash parameter" \
    "npx hardhat isTsaHashRegistered --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "isTsaHashRegistered - Missing diamond parameter" \
    "npx hardhat isTsaHashRegistered --tsa-hash ${TEST_TSA_HASH} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isExternalReferenceIdRegistered (Before Stamp)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isExternalReferenceIdRegistered (Before Stamp)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isExternalReferenceIdRegistered - Non-existent external reference" \
    "npx hardhat isExternalReferenceIdRegistered --external-reference-id ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isExternalReferenceIdRegistered - Missing external-reference-id parameter" \
    "npx hardhat isExternalReferenceIdRegistered --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "isExternalReferenceIdRegistered - Missing diamond parameter" \
    "npx hardhat isExternalReferenceIdRegistered --external-reference-id ${TEST_EXTERNAL_REF_ID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: stamp
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: stamp${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "stamp - Valid parameters (first stamp)" \
    "npx hardhat stamp --original-hash ${TEST_ORIGINAL_HASH} --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "stamp - Valid parameters (second stamp with different hashes)" \
    "npx hardhat stamp --original-hash ${TEST_ORIGINAL_HASH_2} --tsa-hash ${TEST_TSA_HASH_2} --external-reference-id ${TEST_EXTERNAL_REF_ID_2} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "stamp - Duplicate original hash (should fail)" \
    "npx hardhat stamp --original-hash ${TEST_ORIGINAL_HASH} --tsa-hash 0x0000000000000000000000000000000000000000000000000000000000000099 --external-reference-id 0x0000000000000000000000000000000000000000000000000000000000000088 --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stamp - Missing original-hash parameter" \
    "npx hardhat stamp --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stamp - Missing tsa-hash parameter" \
    "npx hardhat stamp --original-hash 0x0000000000000000000000000000000000000000000000000000000000000077 --external-reference-id ${TEST_EXTERNAL_REF_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stamp - Missing external-reference-id parameter" \
    "npx hardhat stamp --original-hash 0x0000000000000000000000000000000000000000000000000000000000000066 --tsa-hash ${TEST_TSA_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stamp - Missing diamond parameter" \
    "npx hardhat stamp --original-hash 0x0000000000000000000000000000000000000000000000000000000000000055 --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: isOriginalHashRegistered (After Stamp)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isOriginalHashRegistered (After Stamp)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isOriginalHashRegistered - Existing hash (should return true)" \
    "npx hardhat isOriginalHashRegistered --original-hash ${TEST_ORIGINAL_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isOriginalHashRegistered - Non-existent hash (should return false but succeed)" \
    "npx hardhat isOriginalHashRegistered --original-hash ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: isTsaHashRegistered (After Stamp)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isTsaHashRegistered (After Stamp)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isTsaHashRegistered - Existing hash (should return true)" \
    "npx hardhat isTsaHashRegistered --tsa-hash ${TEST_TSA_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isTsaHashRegistered - Non-existent hash (should return false but succeed)" \
    "npx hardhat isTsaHashRegistered --tsa-hash ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: isExternalReferenceIdRegistered (After Stamp)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: isExternalReferenceIdRegistered (After Stamp)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "isExternalReferenceIdRegistered - Existing reference (should return true)" \
    "npx hardhat isExternalReferenceIdRegistered --external-reference-id ${TEST_EXTERNAL_REF_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "isExternalReferenceIdRegistered - Non-existent reference (should return false but succeed)" \
    "npx hardhat isExternalReferenceIdRegistered --external-reference-id ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getTsrRecordFromOriginalHash
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getTsrRecordFromOriginalHash${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getTsrRecordFromOriginalHash - Existing record" \
    "npx hardhat getTsrRecordFromOriginalHash --original-hash ${TEST_ORIGINAL_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getTsrRecordFromOriginalHash - Non-existent record" \
    "npx hardhat getTsrRecordFromOriginalHash --original-hash ${NONEXISTENT_HASH} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getTsrRecordFromOriginalHash - Missing original-hash parameter" \
    "npx hardhat getTsrRecordFromOriginalHash --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "getTsrRecordFromOriginalHash - Missing diamond parameter" \
    "npx hardhat getTsrRecordFromOriginalHash --original-hash ${TEST_ORIGINAL_HASH} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: getStampedSize (After Stamps)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getStampedSize (After Stamps)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getStampedSize - Should show at least 2 entries" \
    "npx hardhat getStampedSize --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

# ============================================
# Test Suite: getPaginatedStamped
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: getPaginatedStamped${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "getPaginatedStamped - Valid parameters (page 0, size 10)" \
    "npx hardhat getPaginatedStamped --page-size 10 --page-index 0 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getPaginatedStamped - Valid parameters (page 1, size 1)" \
    "npx hardhat getPaginatedStamped --page-size 1 --page-index 1 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getPaginatedStamped - Large page index (empty result but valid)" \
    "npx hardhat getPaginatedStamped --page-size 10 --page-index 1000 --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "getPaginatedStamped - Missing diamond parameter" \
    "npx hardhat getPaginatedStamped --page-size 10 --page-index 0 --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: stampWithSignature
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: stampWithSignature${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Note: stampWithSignature requires a valid EIP712 signature
# These tests verify parameter validation, not actual signature verification

run_test \
    "stampWithSignature - Missing original-hash parameter" \
    "npx hardhat stampWithSignature --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --sender ${TEST_SENDER} --expiration-timestamp ${TEST_EXPIRATION_TIMESTAMP} --nonce ${TEST_NONCE} --signature ${TEST_SIGNATURE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stampWithSignature - Missing tsa-hash parameter" \
    "npx hardhat stampWithSignature --original-hash 0x0000000000000000000000000000000000000000000000000000000000000044 --external-reference-id ${TEST_EXTERNAL_REF_ID} --sender ${TEST_SENDER} --expiration-timestamp ${TEST_EXPIRATION_TIMESTAMP} --nonce ${TEST_NONCE} --signature ${TEST_SIGNATURE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stampWithSignature - Missing sender parameter" \
    "npx hardhat stampWithSignature --original-hash 0x0000000000000000000000000000000000000000000000000000000000000033 --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --expiration-timestamp ${TEST_EXPIRATION_TIMESTAMP} --nonce ${TEST_NONCE} --signature ${TEST_SIGNATURE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stampWithSignature - Missing signature parameter" \
    "npx hardhat stampWithSignature --original-hash 0x0000000000000000000000000000000000000000000000000000000000000022 --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --sender ${TEST_SENDER} --expiration-timestamp ${TEST_EXPIRATION_TIMESTAMP} --nonce ${TEST_NONCE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "stampWithSignature - Missing diamond parameter" \
    "npx hardhat stampWithSignature --original-hash 0x0000000000000000000000000000000000000000000000000000000000000011 --tsa-hash ${TEST_TSA_HASH} --external-reference-id ${TEST_EXTERNAL_REF_ID} --sender ${TEST_SENDER} --expiration-timestamp ${TEST_EXPIRATION_TIMESTAMP} --nonce ${TEST_NONCE} --signature ${TEST_SIGNATURE} --network ${NETWORK}" \
    "false"

# Note: Testing with a valid signature would require generating the signature dynamically
# This is typically done in unit tests, not in CLI integration tests

# ============================================
# Test Summary
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${SUCCESS_COUNT}${NC}"
echo -e "${RED}Failed:       ${ERROR_COUNT}${NC}"
echo ""

if [[ ${ERROR_COUNT} -eq 0 ]]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi

