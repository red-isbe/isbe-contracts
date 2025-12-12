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

export async function getConfigurationByProxy(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    configurationId: string
    version: number
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    const proxyFactory = await getIsbeFactory(factory, signer)

    const result = await proxyFactory.getConfigurationByProxy(proxyAddress)

    return {
        configurationId: result.configurationId_,
        version: parseInt(result.version_.toString()),
    }
}
