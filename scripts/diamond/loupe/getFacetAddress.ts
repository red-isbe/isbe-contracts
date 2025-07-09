import { Signer } from 'ethers'
import { getDiamondLoupe } from '../../utils/getDiamondLoupe'

export async function getFacetAddress(
    diamond: string,
    selector: string,
    signer: Signer
): Promise<{
    facetAddress: string
}> {
    const diamondLoupe = await getDiamondLoupe(diamond, signer)

    const result = await diamondLoupe.facetAddress(selector)

    return {
        facetAddress: result,
    }
}
