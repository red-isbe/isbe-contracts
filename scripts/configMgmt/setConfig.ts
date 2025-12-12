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
import { BigNumberish, Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'
import { BusinessData } from './interfaces'

export async function setConfig(
    configId: string,
    businessIds: string[],
    versions: number[],
    factory: string,
    signer: Signer
): Promise<{
    configurationId: string
    businessData: BusinessData[]
    version: BigNumberish
}> {
    if (businessIds.length != versions.length)
        throw Error('business Ids and versions length not the same')
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const configManagement = await getIsbeFactory(factory, signer)

    const businessDataInput: BusinessData[] = []

    for (let i = 0; i < businessIds.length; i++) {
        if (!isValidBytesAndLength(businessIds[i], 32))
            throw new Error('Invalid business id format : ' + businessIds[i])

        businessDataInput.push({
            businessId: businessIds[i],
            version: versions[i],
        })
    }

    // Add explicit gas limit to prevent "Internal error" on non-validator nodes
    const tx = await configManagement.setConfiguration(
        configId,
        businessDataInput,
        {
            gasLimit: 25_000_000, // Set high gas limit to avoid estimation issues
        }
    )

    const setConfigEvent = await getEvent(
        'ConfigurationSet',
        tx,
        configManagement
    )

    const { configurationId, businessData, version } = setConfigEvent.args

    return {
        configurationId,
        businessData,
        version: version.toString(),
    }
}
