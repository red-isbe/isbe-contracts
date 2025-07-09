import { Signer } from 'ethers'
import { getDiamondLoupe } from '../../utils/getDiamondLoupe'
import { isValidBytesAndLength } from '../../utils/validation'

export async function getFacetAddress(
    diamond: string,
    selector: string,
    signer: Signer
): Promise<{
    facetAddress: string
}> {
    if (!isValidBytesAndLength(selector, 4))
        throw new Error('Invalid selector format : ' + selector)

    const diamondLoupe = await getDiamondLoupe(diamond, signer)

    const result = await diamondLoupe.facetAddress(selector)

    return {
        facetAddress: result,
    }
}
