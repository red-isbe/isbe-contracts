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

import { getFacetAddress } from '../../../scripts/diamond/loupe/getFacetAddress'
import { getSigner } from '../../../scripts/utils/getSigner'

/**
 npx hardhat getFacetAddress --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
    --selector "0x34a23402"
 */

task('getFacetAddress', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .addParam('selector', 'The selector bytes4')
    .setAction(async (taskArgs, hre) => {
        const { diamond, selector } = taskArgs

        const signer = await getSigner(hre)

        const result = await getFacetAddress(diamond, selector, signer)

        console.log('Facet address:', result)
    })
