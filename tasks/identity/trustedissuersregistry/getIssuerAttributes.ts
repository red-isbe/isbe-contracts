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
import { getIssuerAttributes } from '../../../scripts/identity/trustedissuersregistry/getIssuerAttributes'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getIssuerAttributes --network localhost \
 --page 1 \
 --page-size 10 \
 --diamond "0x00000000000000000000000000000000000015BE"
 */

task('getIssuerAttributes', 'Retrieves paginated list of issuer attributes')
    .addParam('page', 'Zero-indexed page number (uint256)')
    .addParam('pageSize', 'Maximum items per page (uint256)')
    .addParam('did', "Issuer's decentralised identifier")
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { page, pageSize, did, diamond } = taskArgs
        console.log('🔐 Initializing signature provider...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        const signer = await signatureProvider.getSigner()
        const result = await getIssuerAttributes(
            diamond,
            signer,
            did,
            BigInt(page),
            BigInt(pageSize)
        )
        console.log('items:', result.items)
        console.log('total:', result.total.toString())
        console.log('howMany:', result.howMany.toString())
        console.log('prev:', result.prev.toString())
        console.log('next:', result.next.toString())
    })
