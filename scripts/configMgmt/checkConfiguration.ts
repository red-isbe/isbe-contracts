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
import { ISignatureProvider } from '@tasks/index'
import { decodeError } from '../utils/translateCustomError'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function checkConfiguration(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    signatureProvider: ISignatureProvider,
    configId: string,
    configVersion: number
): Promise<boolean> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const signer = await signatureProvider.getSigner()

    const configManagement = await getIsbeFactory(diamond, signer)

    try {
        // This function reverts if configuration doesn't exist
        await configManagement.checkConfiguration(configId, configVersion)
        return true
    } catch (error: unknown) {
        // Check if error has data field (custom error)
        if (
            error &&
            typeof error === 'object' &&
            'data' in error &&
            typeof error.data === 'string'
        ) {
            // Decode the custom error
            const decodedError = await decodeError(
                hre,
                'ConfigurationManagementFacet',
                error.data
            )

            // Check if it's InvalidConfiguration error
            if (decodedError.includes('InvalidConfiguration')) {
                return false
            }
        }

        // Re-throw any other error
        throw error
    }
}
