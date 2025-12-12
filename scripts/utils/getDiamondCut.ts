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
import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondCut(diamondAddress: string, signer: Signer) {
    // Use the specific facet factory since the deployed contract is a diamond with multiple facets
    const { DiamondCutAccessControlFacet__factory } =
        await import('../../typechain-types')
    return getContract(
        DiamondCutAccessControlFacet__factory,
        diamondAddress,
        signer
    )
}
