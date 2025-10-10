#!/bin/bash

BESU_DIR=../isbe-besu-local-deployer
EXEC_BESU="bash install.sh -y"

# Flags
SKIP_GEN=false
SKIP_BESU_STARTUP=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-gen)
      SKIP_GEN=true
      ;;
    --skip-besu-startup)
      SKIP_BESU_STARTUP=true
      ;;
    *)
      echo "⚠️  Unknown argument: $arg"
      ;;
  esac
done






# Step 1: Genesis generation
if [ "$SKIP_GEN" = false ]; then
  echo "🔧 Generating genesis..."
  npx hardhat genesis:generate
else
  echo "⏩ Skipping genesis generation (--skip-gen)"
fi

# cd infra_test
# docker compose up -d --build
# cd ..
# Step 2: Start Besu node network
if [ "$SKIP_BESU_STARTUP" = false ]; then
  echo "******************************************************************************************"
  echo "🚀 Starting Besu node network..."
  CURRENT_DIR=$(pwd)
  cd "$BESU_DIR" || exit 1
  $EXEC_BESU
  cd "$CURRENT_DIR" || exit 1
else
  echo "⏩ Skipping Besu startup (--skip-besu-startup)"
fi


npx hardhat genesis:validate --network genesis_validation_network --gobernanceaddress 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6

REGISTRY_LOCATION=infra_test/isbe-contract-registry.json npx hardhat test test/governance/ProxyFactory.spec.ts --network genesis_validation_network
# npx hardhat test test/governance/ProxyFactory.spec.ts --network genesis_validation_network


# cd infra_test
# docker compose down
# cd ..