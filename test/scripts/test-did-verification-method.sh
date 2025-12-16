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
# DID Verification Method Facet Tasks Test Script
# ----------------------------------------
# This script tests all DID Verification Method tasks with both valid 
# and invalid inputs to verify error handling and success scenarios.
#
# PREREQUISITES:
#   - The DID must already exist (created via insertFirstDidDocument)
#   - The caller must have the appropriate role (DID_REGISTRY_ROLE)
#   - Run test-did-document.sh first to create test DIDs
#
# Usage:
#   ./test-did-verification-method.sh <network>
#
# Example:
#   ./test-did-verification-method.sh localhost
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

# Test data - DID (bytes32 format)
TEST_DID="0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de"
TEST_DID_2="0x6e2ccccc89f87961923680b5c5738b0fbc537b6e3848492ca3d48ee483344eff"
NONEXISTENT_DID="0x0000000000000000000000000000000000000000000000000000000000000001"

# Verification Method IDs (bytes32 format)
TEST_VMETHOD_ID="0x9999999999999999999999999999999999999999999999999999999999999999"
TEST_VMETHOD_ID_2="0x8888888888888888888888888888888888888888888888888888888888888888"
TEST_VMETHOD_ID_NEW="0x7777777777777777777777777777777777777777777777777777777777777777"
TEST_VMETHOD_ID_ROLL="0x6666666666666666666666666666666666666666666666666666666666666666"
NONEXISTENT_VMETHOD="0x0000000000000000000000000000000000000000000000000000000000000002"

# Public keys (uncompressed format 65 bytes - 0x04 + 64 bytes)
TEST_PUBLIC_KEY="0x045f1e2d3c4b6a79880796a5b4c3d2e1f0a9b8c7d6e5f4123456789abcdef00112233445566778899aabbccddeeff1029384756a1b2c3d4e5f60718293a4b5c6d7"
TEST_PUBLIC_KEY_2="0x0477c8231a995dd9bcdfe9ab0b20cfb64a63486a5c2b7e1519bad0d0d5a793102cee664f645dd5bb58b2f9b9f453f3dcd89e5cd9a39af51ed245032e0cd8477221"
TEST_PUBLIC_KEY_NEW="0x04a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6"

# Elliptic curve types
# 0: NONE
# 1: SECP_256_K1 (Ethereum standard)
# 2: SECP_256_R1 (WebAuthn/passkeys)
ELLIPTIC_SECP256K1=1
ELLIPTIC_SECP256R1=2
ELLIPTIC_NONE=0
INVALID_ELLIPTIC=99

# Timestamps
CURRENT_TIME=$(date +%s)
NOTBEFORE=$CURRENT_TIME
NOTAFTER=$((CURRENT_TIME + 2592000))  # 30 days from now
NOTAFTER_LONG=$((CURRENT_TIME + 31536000))  # 1 year from now
NOTAFTER_REVOKE=$CURRENT_TIME  # Now (for revocation)
NOTAFTER_PAST=$((CURRENT_TIME - 86400))  # Yesterday

# Roll duration (30 days in seconds)
ROLL_DURATION=2592000

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} DID Verification Method Tasks Test Suite${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Network: ${NETWORK}"
echo -e "Diamond: ${DIAMOND}"
echo -e "Test DID: ${TEST_DID}"
echo -e "Test VMethod ID: ${TEST_VMETHOD_ID}"
echo -e "NotBefore: ${NOTBEFORE}"
echo -e "NotAfter: ${NOTAFTER}"
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
# Test Suite: addVerificationMethod (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: addVerificationMethod (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "addVerificationMethod - Add SECP256K1 verification method" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationMethod - Add second verification method" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_2} --publickey ${TEST_PUBLIC_KEY_2} --elliptictype ${ELLIPTIC_SECP256K1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationMethod - Add verification method for second DID" \
    "npx hardhat addVerificationMethod --did ${TEST_DID_2} --vmethodid ${TEST_VMETHOD_ID_NEW} --publickey ${TEST_PUBLIC_KEY_NEW} --elliptictype ${ELLIPTIC_SECP256R1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "addVerificationMethod - Missing did parameter" \
    "npx hardhat addVerificationMethod --vmethodid ${TEST_VMETHOD_ID} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationMethod - Missing vmethodid parameter" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationMethod - Missing publickey parameter" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --elliptictype ${ELLIPTIC_SECP256K1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationMethod - Missing elliptictype parameter" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --publickey ${TEST_PUBLIC_KEY} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationMethod - Missing diamond parameter" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --network ${NETWORK}" \
    "false"

run_test \
    "addVerificationMethod - Duplicate vMethodId (should fail - PublicKeyAlreadyInUse)" \
    "npx hardhat addVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --publickey ${TEST_PUBLIC_KEY} --elliptictype ${ELLIPTIC_SECP256K1} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: expireVerificationMethod (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: expireVerificationMethod (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "expireVerificationMethod - Set expiration for verification method" \
    "npx hardhat expireVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_2} --notafter ${NOTAFTER_LONG} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "expireVerificationMethod - Missing did parameter" \
    "npx hardhat expireVerificationMethod --vmethodid ${TEST_VMETHOD_ID} --notafter ${NOTAFTER_LONG} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "expireVerificationMethod - Missing vmethodid parameter" \
    "npx hardhat expireVerificationMethod --did ${TEST_DID} --notafter ${NOTAFTER_LONG} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "expireVerificationMethod - Missing notafter parameter" \
    "npx hardhat expireVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "expireVerificationMethod - Non-existent verification method (should fail)" \
    "npx hardhat expireVerificationMethod --did ${TEST_DID} --vmethodid ${NONEXISTENT_VMETHOD} --notafter ${NOTAFTER_LONG} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: rollVerificationMethod (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: rollVerificationMethod (Key Rotation)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "rollVerificationMethod - Rotate key for verification method" \
    "npx hardhat rollVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_ROLL} --publickey ${TEST_PUBLIC_KEY_NEW} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER_LONG} --oldvmethodid ${TEST_VMETHOD_ID} --duration ${ROLL_DURATION} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "rollVerificationMethod - Missing did parameter" \
    "npx hardhat rollVerificationMethod --vmethodid ${TEST_VMETHOD_ID_ROLL} --publickey ${TEST_PUBLIC_KEY_NEW} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER_LONG} --oldvmethodid ${TEST_VMETHOD_ID} --duration ${ROLL_DURATION} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "rollVerificationMethod - Missing vmethodid parameter" \
    "npx hardhat rollVerificationMethod --did ${TEST_DID} --publickey ${TEST_PUBLIC_KEY_NEW} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER_LONG} --oldvmethodid ${TEST_VMETHOD_ID} --duration ${ROLL_DURATION} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "rollVerificationMethod - Missing oldvmethodid parameter" \
    "npx hardhat rollVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_ROLL} --publickey ${TEST_PUBLIC_KEY_NEW} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER_LONG} --duration ${ROLL_DURATION} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "rollVerificationMethod - Missing duration parameter" \
    "npx hardhat rollVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_ROLL} --publickey ${TEST_PUBLIC_KEY_NEW} --elliptictype ${ELLIPTIC_SECP256K1} --notbefore ${NOTBEFORE} --notafter ${NOTAFTER_LONG} --oldvmethodid ${TEST_VMETHOD_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

# ============================================
# Test Suite: revokeVerificationMethod (Write)
# ============================================
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Testing: revokeVerificationMethod (Write Operations)${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

run_test \
    "revokeVerificationMethod - Revoke verification method (immediate)" \
    "npx hardhat revokeVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_2} --notafter ${NOTAFTER_REVOKE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "true"

run_test \
    "revokeVerificationMethod - Missing did parameter" \
    "npx hardhat revokeVerificationMethod --vmethodid ${TEST_VMETHOD_ID} --notafter ${NOTAFTER_REVOKE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeVerificationMethod - Missing vmethodid parameter" \
    "npx hardhat revokeVerificationMethod --did ${TEST_DID} --notafter ${NOTAFTER_REVOKE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeVerificationMethod - Missing notafter parameter" \
    "npx hardhat revokeVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeVerificationMethod - Non-existent verification method (should fail)" \
    "npx hardhat revokeVerificationMethod --did ${TEST_DID} --vmethodid ${NONEXISTENT_VMETHOD} --notafter ${NOTAFTER_REVOKE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

run_test \
    "revokeVerificationMethod - Already revoked method (should fail)" \
    "npx hardhat revokeVerificationMethod --did ${TEST_DID} --vmethodid ${TEST_VMETHOD_ID_2} --notafter ${NOTAFTER_REVOKE} --diamond ${DIAMOND} --network ${NETWORK}" \
    "false"

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

