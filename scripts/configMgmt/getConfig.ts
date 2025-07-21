import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'
import { BusinessData } from './interfaces'

export async function getConfig(
    configId: string,
    version: number,
    factory: string,
    signer: Signer
): Promise<{
    businessData: BusinessData[]
}> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const configManagement = await getIsbeFactory(factory, signer)

    const result = await configManagement.getConfiguration(configId, version)

    const businessData: BusinessData[] = []

    for (let i = 0; i < result.length; i++) {
        businessData.push({
            businessId: result[i].businessId,
            version: Number(result[i].version),
        })
    }

    return {
        businessData,
    }
}
