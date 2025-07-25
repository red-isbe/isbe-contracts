import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getFacetAddresses(
    configId: string,
    version: number,
    factory: string,
    signer: Signer
): Promise<{
    facetAddresses: string[]
}> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const configManagement = await getIsbeFactory(factory, signer)

    const result = await configManagement.facetAddresses(configId, version)

    return {
        facetAddresses: result,
    }
}
