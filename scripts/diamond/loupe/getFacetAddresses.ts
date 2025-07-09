import { Signer } from 'ethers'
import { getDiamondLoupe } from '../../utils/getDiamondLoupe'

export async function getFacetAddresses(
    diamond: string,
    signer: Signer
): Promise<{
    facetAddresses: string[]
}> {
    const diamondLoupe = await getDiamondLoupe(diamond, signer)

    const result = await diamondLoupe.facetAddresses()

    return {
        facetAddresses: result,
    }
}
