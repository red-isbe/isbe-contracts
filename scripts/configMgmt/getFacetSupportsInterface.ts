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
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'
import { ISignatureProvider } from '../../tasks/index'

export async function getFacetSupportsInterface(
    hre: unknown,
    diamond: string,
    signatureProvider: ISignatureProvider,
    configId: string,
    configVersion: number,
    interfaceId: string
): Promise<boolean> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const signer = await signatureProvider.getSigner()

    const configManagement = await getIsbeFactory(diamond, signer)

    const result = await configManagement.facetSupportsInterface(
        configId,
        configVersion,
        interfaceId
    )

    return result
}
