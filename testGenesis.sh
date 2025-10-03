#!/bin/bash

npx hardhat genesis:generate

cd infra_test
docker compose up -d --build
cd ..

npx hardhat genesis:validate --network genesis_validation_network --gobernanceaddress 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6

cd infra_test
docker compose down
cd ..