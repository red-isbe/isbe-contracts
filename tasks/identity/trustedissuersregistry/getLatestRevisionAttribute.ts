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
import { task } from 'hardhat/config'
import { getLatestRevisionAttribute } from '../../../scripts/identity/trustedissuersregistry/getLatestRevisionAttribute'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getLatestRevisionAttribute --network localhost \
 --issuer-did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --attribute-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task('getLatestRevisionAttribute', 'Retrieves latest revision of an attribute')
    .addParam('issuerDid', "Issuer's decentralised identifier (bytes32)")
    .addParam('attributeId', 'Attribute identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { issuerDid, diamond, attributeId } = taskArgs // Removed revisionId as it's not needed anymore
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getLatestRevisionAttribute(
            diamond,
            signer,
            issuerDid,
            attributeId
        )
        console.log('attribute:', JSON.stringify(result, null, 2))
    })
