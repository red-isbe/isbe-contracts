/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
import { task, types } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { updateNetwork } from '../../../scripts/client/networkDirectory/updateNetwork'
import {
    Algorithm,
    Stage,
} from '../../../scripts/client/networkDirectory/createNetwork'

/**
 npx hardhat updateNetwork --network localhost \
  --chain-id 2024 \
  --name "Alastria T Updated" \
  --symbol "ALAT" \
  --algorithm 1 \
  --stage 2 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('updateNetwork', 'Updates an existing network in the NetworkDirectory')
    .addParam(
        'chainId',
        'The chain ID of the network to update (uint256)',
        undefined,
        types.int
    )
    .addParam(
        'name',
        'The new name of the network (string, will be converted to bytes32)'
    )
    .addParam(
        'symbol',
        'The new symbol of the network (string, will be converted to bytes32)'
    )
    .addParam(
        'algorithm',
        'The algorithm type: 0=NONE, 1=SECP256K1, 2=SECP256R1',
        undefined,
        types.int
    )
    .addParam(
        'stage',
        'The stage: 0=NONE, 1=DEV, 2=PRE, 3=PROD',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, name, symbol, algorithm, stage, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await updateNetwork(
            hre,
            {
                chainId,
                name,
                symbol,
                algorithm: algorithm as Algorithm,
                stage: stage as Stage,
            },
            diamond,
            signatureProvider
        )
    })
