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
