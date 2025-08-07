import { Signer } from 'ethers'
import { getDiamondLoupe } from '../../utils/getDiamondLoupe'

export async function getFacets(
    diamond: string,
    signer: Signer
): Promise<{
    facets: {
        facetAddress: string
        functionSelectors: string[]
    }[]
}> {
    const diamondLoupe = await getDiamondLoupe(diamond, signer)

    const result = await diamondLoupe.facets()

    return {
        facets: result,
    }
}
