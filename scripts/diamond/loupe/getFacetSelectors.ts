import { Signer } from 'ethers'
import { getDiamondLoupe } from '../../utils/getDiamondLoupe'

export async function getFacetSelectors(
    diamond: string,
    facetAddress: string,
    signer: Signer
): Promise<{
    functionSelectors: string[]
}> {
    const diamondLoupe = await getDiamondLoupe(diamond, signer)

    const result = await diamondLoupe.facetFunctionSelectors(facetAddress)

    return {
        functionSelectors: result,
    }
}
