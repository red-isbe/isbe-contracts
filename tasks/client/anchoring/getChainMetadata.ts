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
import { getChainMetadata } from '../../../scripts/client/anchoring/getChainMetadata'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:getchainmetadata \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getchainmetadata',
    'Prepare parameters for calling IAnchoringCore.getChainMetadata'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .setAction(async (taskArgs, hre) => {
        const { governancediamond } = taskArgs

        console.log('anchoringcorefacet:getchainmetadata')
        console.log('Target Governance Diamond:', governancediamond)
        console.log('Function: getChainMetadata()')
        console.log(`Network: ${hre.network.name}`)

        const signatureProvider = SignatureProviderFactory.create(hre)
        console.log(`Curve: ${signatureProvider.getCurveType()}`)

        const result = await getChainMetadata(
            hre,
            governancediamond,
            signatureProvider
        )

        console.log('\n✅ getChainMetadata result:')
        console.log('  thisChainId      :', result.thisChainId.toString())
        console.log(
            '  registeredChainIds:',
            result.registeredChainIds.map((id) => id.toString()).join(', ')
        )
    })
