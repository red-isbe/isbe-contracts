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
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getFacetAddress } from '../../../scripts/diamond/loupe/getFacetAddress'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat getFacetAddress --network isbe \
  --selector "0xe8aff049"

 npx hardhat getFacetAddress --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
    --selector "0x34a23402"

 The signer comes from SignatureProviderFactory, so it works with local keys
 (secp256k1 / secp256r1) and with AWS KMS keys configured for the network.
 */

task('getFacetAddress', 'Returns the facet address that implements a selector')
    .addOptionalParam(
        'diamond',
        'The diamond contract address (default: 0x...15BE)',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam('selector', 'The selector bytes4', undefined, types.string)
    .setAction(
        async (
            taskArgs: { diamond: string; selector: string },
            hre: HardhatRuntimeEnvironment
        ) => {
            const { diamond, selector } = taskArgs

            const signatureProvider = SignatureProviderFactory.create(hre)
            const signer = await signatureProvider.getSigner()

            const result = await getFacetAddress(diamond, selector, signer)

            console.log('Facet address:', result)
        }
    )
