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
