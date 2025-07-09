import { Signer } from 'ethers'
import { getDiamondLoupe } from '../../utils/getDiamondLoupe'
import { isValidBytesAndLength } from '../../utils/validation'

export async function getFacetSelectors(
    diamond: string,
    facetAddress: string,
    signer: Signer
): Promise<{
    functionSelectors: string[]
}> {
    if (!isValidBytesAndLength(facetAddress, 20))
        throw new Error('Invalid facet address format : ' + facetAddress)

    const diamondLoupe = await getDiamondLoupe(diamond, signer)

    const result = await diamondLoupe.facetFunctionSelectors(facetAddress)

    return {
        functionSelectors: result,
    }
}
