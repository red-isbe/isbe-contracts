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

#grantNetworkPermissions.sh \
#"http://localhost:8545" \
#"30962" \
#"secp256r1" \
#"0xce1ea1b52951358bf819018b6dc7da1fb7e7cba9" \
#"0x0e1d0271f035f5fdd38e3faea42c5bade1ee314e" \
#"0xe1a6185a75f053dde7458f1499ea06506fd3abad" \
#"0xe8a0e897583bf18895e9740d5b0ffd2b0da3c931"

# Set ISBE_URL and CHAIN_ID as first and second parameters
ISBE_URL=$1
CHAIN_ID=$2
CURVE=$3
GDPR_ADDRESS=$4
USE_CASE_MNGMT_ADDRESS=$5
IDENTITY_MNGMT_ADDRESS=$6
OPERATIONAL_MNGMT_ADDRESS=$7

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
--account $GDPR_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb" \
--account $GDPR_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xdc99c621188983b30fd7ff7b62ee13c081548c6b000e3c54b59686f091418069" \
--account $USE_CASE_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb" \
--account $USE_CASE_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xc6832bf28cac8042fe5597e3b605a7fa9af230954df24409efd82699171f3c26" \
--account $USE_CASE_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0x643e67198985fdbcfc2807234f580aa2cab96bb7efe1ab3158da79255d493114" \
--account $GDPR_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973" \
--account $IDENTITY_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0x851082823889050845ac21877ec718094d3f20497e34e5a8281bde69dde672e5" \
--account $IDENTITY_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0x6e23e5e4b53b45e5b32b8b2e8e9a8c48b8a7c3b9c2b8a9a7b9a8c4b8b9a8c9b9" \
--account $IDENTITY_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xcbb09df20dd6e5dbe10d3957a6ca4269c2c926a5334d2cbcd9ea39ab0593f79a" \
--account $OPERATIONAL_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xb041d3ca73c73e8e0c7f8c77caf5bd3268e3aaca676b32484b3da5b75deb85fe" \
--account $OPERATIONAL_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0x8f0b8c4e3e1e3e8a5c8c9c8f8e7c8c1a3e3e3f8c8e8c8f8e7c8c1a3e3e3f8c8e" \
--account $OPERATIONAL_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0x9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b" \
--account $OPERATIONAL_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xd9a7f0b03b752d9c44200ba27e635446a5cfcfec8a2720d6b06e3a170e5bc43b" \
--account $OPERATIONAL_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe

ISBE_URL=$ISBE_URL CHAIN_ID=$CHAIN_ID CURVE=$CURVE npx hardhat grantRole \
--role "0xde626b2d09629d2f22e508eb4635d61e0f8ab77b4ad08e0823135c887724bac8" \
--account $OPERATIONAL_MNGMT_ADDRESS \
--diamond "0x00000000000000000000000000000000000015BE" --network isbe
