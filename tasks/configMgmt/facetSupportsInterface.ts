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
----------------------------------------------------------------------------------- */
import { task, types } from 'hardhat/config'

import { getFacetSupportsInterface } from '../../scripts/configMgmt/getFacetSupportsInterface'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'

/**
 npx hardhat facetSupportsInterface --network genesis_validation_network_k1 \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --config-version 1 \
  --interface-id "0x01ffc9a7" \
  --diamond "0x00000000000000000000000000000000000015BE"

Note: interface-id examples:
  - ERC165: 0x01ffc9a7
  - ERC721: 0x80ac58cd
  - ERC20: 0x36372b07
  - IDiamondCut: 0x1f931c1c
  - IDiamondLoupe: 0x48e2b093
 */

task(
    'facetSupportsInterface',
    'Check if a facet in the configuration supports a specific interface'
)
    .addParam('configId', 'The configuration ID (bytes32)')
    .addParam('configVersion', 'The version number')
    .addParam('interfaceId', 'The interface ID to check (bytes4)')
    .addOptionalParam(
        'diamond',
        'The diamond contract address',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                configId: string
                configVersion: number
                interfaceId: string
                diamond: string
            },
            hre
        ) => {
            const { configId, configVersion, interfaceId, diamond } = taskArgs

            const signatureProvider = SignatureProviderFactory.create(hre)

            console.log('\nFACET SUPPORTS INTERFACE')
            console.log('Configuration ID:', configId)
            console.log('Version:', configVersion)
            console.log('Interface ID:', interfaceId)
            console.log('Diamond:', diamond)
            console.log('Network:', hre.network.name)

            const supported = await getFacetSupportsInterface(
                hre,
                diamond,
                signatureProvider,
                configId,
                configVersion,
                interfaceId
            )

            console.log('\n📋 Result:')
            console.log(`   Supported: ${supported}`)
        }
    )
