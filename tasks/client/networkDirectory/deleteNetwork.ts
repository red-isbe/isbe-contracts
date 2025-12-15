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
import { deleteNetwork } from '../../../scripts/client/networkDirectory/deleteNetwork'

/**
 npx hardhat deleteNetwork --network localhost \
  --chain-id 2024 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('deleteNetwork', 'Deletes a network from the NetworkDirectory')
    .addParam(
        'chainId',
        'The chain ID of the network to delete (uint256)',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await deleteNetwork(hre, chainId, diamond, signatureProvider)
    })
