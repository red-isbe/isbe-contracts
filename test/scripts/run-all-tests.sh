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
# Master Test Script - Run All Facet Tests
# ----------------------------------------
# This script runs all facet test scripts in the correct order,
# respecting dependencies between facets.
#
# Execution Order:
#   1. Standalone tests (no dependencies)
#      - test-client-filtering.sh
#      - test-ens-registry.sh
#      - test-did-registry-query.sh
#   2. DID Document tests (creates DIDs)
#      - test-did-document.sh
#   3. Tests that require existing DIDs
#      - test-did-verification-method.sh
#      - test-did-controller.sh
#      - test-access-control-did.sh
#   4. Tests that require verification methods
#      - test-did-verification-relationship.sh
#   5. Timestamping tests
#      - test-timestamping.sh
#
# Usage:
#   ./run-all-tests.sh <network>
#
# Example:
#   ./run-all-tests.sh localhost
# ----------------------------------------

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Network parameter (required)
if [[ $# -eq 0 ]]; then
    echo -e "${RED}❌ Error: Network parameter is required${NC}"
    echo "Usage: $0 <network>"
    echo "Example: $0 localhost"
    exit 1
fi

NETWORK="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Counters
PASSED_SUITES=0
FAILED_SUITES=0
TOTAL_SUITES=0

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           ISBE Contracts - Master Test Suite               ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Network: ${NETWORK}${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run a test suite
run_suite() {
    local suite_name="$1"
    local script_name="$2"
    
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    echo -e "${BLUE}┌────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│  Running: ${suite_name}${NC}"
    echo -e "${BLUE}└────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    if bash "${SCRIPT_DIR}/${script_name}" "${NETWORK}"; then
        echo -e "${GREEN}✅ Suite PASSED: ${suite_name}${NC}"
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        echo -e "${RED}❌ Suite FAILED: ${suite_name}${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
    
    echo ""
    echo -e "${YELLOW}────────────────────────────────────────────────────────────${NC}"
    echo ""
}

# ============================================
# Phase 1: Standalone Tests (No Dependencies)
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} Phase 1: Standalone Tests (No Dependencies)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

run_suite "Client Filtering Facet" "test-client-filtering.sh"
run_suite "ENS Registry Facet" "test-ens-registry.sh"
run_suite "DID Registry Query Facet" "test-did-registry-query.sh"

# ============================================
# Phase 2: DID Document Tests (Creates DIDs)
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} Phase 2: DID Document Tests (Creates DIDs)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

run_suite "DID Document Facet" "test-did-document.sh"

# ============================================
# Phase 3: Tests Requiring Existing DIDs
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} Phase 3: Tests Requiring Existing DIDs${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

run_suite "DID Verification Method Facet" "test-did-verification-method.sh"
run_suite "DID Controller Facet" "test-did-controller.sh"
run_suite "Access Control DID Governance Facet" "test-access-control-did.sh"

# ============================================
# Phase 4: Tests Requiring Verification Methods
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} Phase 4: Tests Requiring Verification Methods${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

run_suite "DID Verification Relationship Facet" "test-did-verification-relationship.sh"

# ============================================
# Phase 5: Timestamping Tests
# ============================================
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN} Phase 5: Timestamping Tests${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

run_suite "Timestamping Facet" "test-timestamping.sh"

# ============================================
# Final Summary
# ============================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    FINAL SUMMARY                           ║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Total Test Suites: ${TOTAL_SUITES}${NC}"
echo -e "${CYAN}║  ${GREEN}Passed: ${PASSED_SUITES}${CYAN}${NC}"
echo -e "${CYAN}║  ${RED}Failed: ${FAILED_SUITES}${CYAN}${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [[ ${FAILED_SUITES} -eq 0 ]]; then
    echo -e "${GREEN}🎉 All test suites passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some test suites failed!${NC}"
    exit 1
fi

