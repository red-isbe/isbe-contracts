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
import { setResource } from '../../../scripts/client/networkDirectory/setResource'

/**
 npx hardhat setResource --network localhost \
  --chain-id 2024 \
  --resource-id "RPC2" \
  --resource "https://rpc.alastria.io" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('setResource', 'Sets or updates a resource for a network')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam(
        'resourceId',
        'The resource identifier (string, will be converted to bytes32)'
    )
    .addParam('resource', 'The resource value (URL or string)')
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, resourceId, resource, diamond } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        await setResource(
            chainId,
            resourceId,
            resource,
            diamond,
            signatureProvider
        )
    })
