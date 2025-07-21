import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getFacets(
    configId: string,
    version: number,
    factory: string,
    signer: Signer
): Promise<{
    facets: {
        facetAddress: string
        functionSelectors: string[]
    }[]
}> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const configManagement = await getIsbeFactory(factory, signer)

    const result = await configManagement.facets(configId, version)

    return {
        facets: result,
    }
}
