#!/bin/bash

BESU_DIR=../isbe-besu-local-deployer
EXEC_BESU="bash install.sh -y"

npx hardhat genesis:generate

# cd infra_test
# docker compose up -d --build
# cd ..
echo "******************************************************************************************"
echo "Starting Besu node network..."
CURRENT_DIR=$(pwd)
cd $BESU_DIR
$EXEC_BESU
cd $CURRENT_DIR


npx hardhat genesis:validate --network genesis_validation_network --gobernanceaddress 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6

REGISTRY_LOCATION=infra_test/isbe-contract-registry.json npx hardhat test test/governance/ProxyFactory.spec.ts --network genesis_validation_network


# cd infra_test
# docker compose down
# cd ..