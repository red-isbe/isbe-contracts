import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getFacetSelectors(
    configId: string,
    version: number,
    factory: string,
    facetAddress: string,
    signer: Signer
): Promise<{
    functionSelectors: string[]
}> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)
    if (!isValidBytesAndLength(facetAddress, 20))
        throw new Error('Invalid facet address format : ' + facetAddress)

    const configManagement = await getIsbeFactory(factory, signer)

    const result = await configManagement.facetFunctionSelectors(
        configId,
        version,
        facetAddress
    )

    return {
        functionSelectors: result,
    }
}
