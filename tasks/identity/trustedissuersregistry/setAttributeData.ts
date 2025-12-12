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
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { setAttributeData } from '../../../scripts/identity/trustedissuersregistry/setAttributeData'

/**
 * npx hardhat setAttributeData --network localhost \
 *  --did "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
 *  --attribute-id "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1"\
 *  --attribute-data "0x15BEC390" \
 *  --diamond "0x00000000000000000000000000000000000015BE"
 */
task('setAttributeData', 'Sets attribute metadata for a DID')
    .addParam('did', 'The DID identifier (bytes32)')
    .addParam('attributeId', 'The attribute identifier (bytes32)')
    .addParam('attributeData', 'Serialized attribute data')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { did, attributeId, attributeData, diamond } = taskArgs

        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        console.log('📋 Setting attribute metadata with parameters:')
        console.log(`   DID: ${did}`)
        console.log(`   Attribute ID: ${attributeId}`)
        console.log(`   Attribute Data: ${attributeData}`)
        console.log(`   Proxy address: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await setAttributeData(
            did,
            attributeId,
            attributeData,
            diamond,
            signatureProvider
        )

        console.log(`\n✅ Attribute metadata set successfully`)
        console.log(`   did: ${result.did}`)
        console.log(`   issuerType: ${result.attributeId}`)
        console.log(`   Revision ID: ${result.attributeData}`)
    })
