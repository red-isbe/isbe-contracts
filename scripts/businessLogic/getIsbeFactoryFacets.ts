import { Signer } from 'ethers'
import { getDiamondLoupe } from '../utils/getDiamondLoupe'

export async function getIsbeFactoryFacets(
    factory: string,
    signer: Signer
): Promise<{
    facets: {
        facetAddress: string
        functionSelectors: string[]
    }[]
}> {
    const diamondLoupe = await getDiamondLoupe(factory, signer)

    const result = await diamondLoupe.facets()

    return {
        facets: result,
    }
}
