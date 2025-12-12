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
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getFacetAddress(
    configId: string,
    version: number,
    factory: string,
    selector: string,
    signer: Signer
): Promise<{
    facetAddress: string
}> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)
    if (!isValidBytesAndLength(selector, 4))
        throw new Error('Invalid selector format : ' + selector)

    const configManagement = await getIsbeFactory(factory, signer)

    const result = await configManagement.facetAddress(
        configId,
        version,
        selector
    )

    return {
        facetAddress: result,
    }
}
