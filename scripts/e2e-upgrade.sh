#!/bin/bash
# -----------------------------------------------------------------------------------
# Copyright (c) 2025 Comunidad de Madrid & Alastria
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# -----------------------------------------------------------------------------------

# =============================================================================
# ISBE Diamond E2E Upgrade Script
# =============================================================================
#
# This script runs the end-to-end diamond upgrade process for both secp256k1
# and secp256r1 networks.
#
# Prerequisites:
# - isbe-besu-local-deployer running with RPC on localhost:8545
# - Node.js v18+ and npm installed
# - isbe-contracts compiled (npx hardhat compile)
#
# Usage:
#   ./scripts/e2e-upgrade.sh [--k1] [--r1] [--dry-run] [--help]
#
# Options:
#   --k1       Run only secp256k1 network test
#   --r1       Run only secp256r1 network test
#   --dry-run  Show what would be done without executing transactions
#   --help     Show this help message
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default settings
RUN_K1=true
RUN_R1=true
DRY_RUN=""
REPORT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${REPORT_DIR}/e2e-upgrade-${TIMESTAMP}.log"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}           $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}           $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

show_help() {
    cat << EOF
ISBE Diamond E2E Upgrade Script

Usage: ./scripts/e2e-upgrade.sh [OPTIONS]

Options:
    --k1       Run only secp256k1 network test (default: both)
    --r1       Run only secp256r1 network test (default: both)
    --dry-run  Show what would be done without executing transactions
    --help     Show this help message

Prerequisites:
    - isbe-besu-local-deployer running with RPC on localhost:8545
    - Node.js v18+ and npm installed
    - isbe-contracts compiled (npx hardhat compile)

Network Configuration:
    - secp256k1: network=isbelocaldeployer, url=http://127.0.0.1:8545
    - secp256r1: network=customSecondR1Network, url=http://127.0.0.1:8545

Examples:
    # Run both curve tests
    ./scripts/e2e-upgrade.sh

    # Run only secp256k1 test
    ./scripts/e2e-upgrade.sh --k1

    # Dry-run secp256r1 test
    ./scripts/e2e-upgrade.sh --r1 --dry-run

EOF
    exit 0
}

check_prerequisites() {
    print_section "PRE-FLIGHT CHECKS"

    # Check if we're in the right directory
    if [ ! -f "hardhat.config.ts" ]; then
        print_error "Not in isbe-contracts directory. Please run from project root."
        exit 1
    fi

    # Check if contracts are compiled
    if [ ! -d "artifacts" ]; then
        print_warning "Contracts not compiled. Running compile..."
        npx hardhat compile
    fi

    # Check network connectivity
    print_info "Checking network connectivity..."
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://127.0.0.1:8545 > /dev/null 2>&1; then
        print_success "Network accessible at http://127.0.0.1:8545"
    else
        print_error "Network not accessible at http://127.0.0.1:8545"
        print_info "Please start isbe-besu-local-deployer first:"
        print_info "  cd /path/to/isbe-besu-local-deployer && bash install.sh"
        exit 1
    fi

    print_success "All prerequisites met"
}

run_upgrade() {
    local network=$1
    local curve=$2
    local dry_run_flag=$3

    print_header "RUNNING UPGRADE: ${curve} (${network})"

    local cmd="npx hardhat upgradeDiamondE2E --network ${network} --check-versions ${dry_run_flag}"

    print_info "Running: ${cmd}"
    echo ""

    if ${cmd} 2>&1 | tee -a "${REPORT_FILE}"; then
        print_success "Upgrade completed successfully for ${curve}"
        return 0
    else
        print_error "Upgrade failed for ${curve}"
        return 1
    fi
}

# =============================================================================
# Main Script
# =============================================================================

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --k1)
            RUN_R1=false
            shift
            ;;
        --r1)
            RUN_K1=false
            shift
            ;;
        --dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Create report directory
mkdir -p "${REPORT_DIR}"

print_header "ISBE DIAMOND E2E UPGRADE SCRIPT"
echo "Timestamp: ${TIMESTAMP}" | tee "${REPORT_FILE}"
echo "Dry Run: ${DRY_RUN:-false}" | tee -a "${REPORT_FILE}"
echo "Run K1: ${RUN_K1}" | tee -a "${REPORT_FILE}"
echo "Run R1: ${RUN_R1}" | tee -a "${REPORT_FILE}"

# Check prerequisites
check_prerequisites

# Track results
K1_RESULT=0
R1_RESULT=0

# Run secp256k1 test
if [ "${RUN_K1}" = true ]; then
    print_section "secp256k1 NETWORK TEST"
    print_info "Make sure isbe-besu-local-deployer is configured with secp256k1 curve"
    print_info "Network: isbelocaldeployer"

    if run_upgrade "isbelocaldeployer" "secp256k1" "${DRY_RUN}"; then
        K1_RESULT=0
    else
        K1_RESULT=1
    fi
fi

# Run secp256r1 test
if [ "${RUN_R1}" = true ]; then
    print_section "secp256r1 NETWORK TEST"
    print_info "Make sure isbe-besu-local-deployer is configured with secp256r1 curve"
    print_info "Network: customSecondR1Network"
    print_warning "Note: secp256r1 requires reconfiguring and restarting the Besu network"
    print_info "To reconfigure:"
    print_info "  cd /path/to/isbe-besu-local-deployer"
    print_info "  bash clean.sh"
    print_info "  bash install.sh  # Choose secp256r1 when prompted"
    print_info ""
    read -p "Press Enter when the network is ready with secp256r1 curve..."

    # Set CURVE environment variable for secp256r1
    export CURVE=secp256r1

    if run_upgrade "customSecondR1Network" "secp256r1" "${DRY_RUN}"; then
        R1_RESULT=0
    else
        R1_RESULT=1
    fi
fi

# Final summary
print_header "UPGRADE SUMMARY"

if [ "${RUN_K1}" = true ]; then
    if [ ${K1_RESULT} -eq 0 ]; then
        print_success "secp256k1: PASSED"
    else
        print_error "secp256k1: FAILED"
    fi
fi

if [ "${RUN_R1}" = true ]; then
    if [ ${R1_RESULT} -eq 0 ]; then
        print_success "secp256r1: PASSED"
    else
        print_error "secp256r1: FAILED"
    fi
fi

echo ""
print_info "Report saved to: ${REPORT_FILE}"

# Exit with appropriate code
if [ "${RUN_K1}" = true ] && [ ${K1_RESULT} -ne 0 ]; then
    exit 1
fi

if [ "${RUN_R1}" = true ] && [ ${R1_RESULT} -ne 0 ]; then
    exit 1
fi

