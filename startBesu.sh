#!/usr/bin/env bash

set -euo pipefail

NETWORK_TYPE="CASE"

print_usage() {
  echo ""
  echo "Usage:"
  echo "  $0 [--type <BARE|CASE>] [--help]"
  echo ""
  echo "Options:"
  echo "  --type <BARE|CASE>   Specify the type of network (default: CASE)."
  echo "  --help               Show this help message and exit."
  echo ""
  echo "Example:"
  echo "  $0 --type BARE"
  echo ""
  echo "Description:"
  echo "  This script initializes git submodules and starts a local Besu deployment."
}

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --type)
      if [[ $# -lt 2 ]]; then
        echo "❌ Missing value for --type"
        print_usage
        exit 1
      fi
      NETWORK_TYPE="$2"
      shift 2
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      echo "⚠️  Unknown argument: $1"
      print_usage
      exit 1
      ;;
  esac
done

# Validate NETWORK_TYPE
case "$NETWORK_TYPE" in
  BARE|CASE)
    ;;
  *)
    echo "❌ Invalid NETWORK_TYPE: '$NETWORK_TYPE'. Allowed values: BARE, CASE."
    exit 1
    ;;
esac

# --- Init submodules ---
echo "🔄 Initializing Git submodules..."

if [[ -x "./initSubmodules.sh" ]]; then
  ./initSubmodules.sh
elif [[ -x "./scripts/init-submodules.sh" ]]; then
  ./scripts/init-submodules.sh
else
  echo "❌ initSubmodules script not found. Expected ./initSubmodules.sh or ./scripts/init-submodules.sh"
  exit 1
fi

# --- Select genesis template by network type ---
GENESIS_TEMPLATE="./modules/isbe-genesis-files/DEV/case/genesis-case-dev.json"
OUTPUT_FILE="./modules/isbe-genesis-files/DEV/case/genesis-case-dev-GEN.json"
NETWORK_ID="genesis_validation_network_k1"

if [[ "$NETWORK_TYPE" == "BARE" ]]; then
  GENESIS_TEMPLATE="./modules/isbe-genesis-files/DEV/bare/genesis-bare-dev.json"
  OUTPUT_FILE="./modules/isbe-genesis-files/DEV/bare/genesis-bare-dev-GEN.json"
  NETWORK_ID="genesis_validation_network_r1"
fi

echo "🔄 Starting Besu local deployment for network type: $NETWORK_TYPE"
echo "   Genesis template: $GENESIS_TEMPLATE"
echo "   Output file:      $OUTPUT_FILE"

./makeGenesis.sh \
  --skip-gen \
  --do-besu-startup \
  --besu-dir "modules/isbe-besu-local-deployer" \
  --template-file "$GENESIS_TEMPLATE" \
  --output-file "$OUTPUT_FILE" \
  --gobernance-address 0x00000000000000000000000000000000000015BE

echo " waiting 10 seconds for Besu to stabilize..."
sleep 10

echo "🔄 Bootstrapping genesis validation network..."
npx hardhat genesis:bootstrap --governanceaddress 0x00000000000000000000000000000000000015BE --network  "$NETWORK_ID"
