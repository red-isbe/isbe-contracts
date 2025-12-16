import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondCut(diamondAddress: string, signer: Signer) {
    // Use the specific facet factory since the deployed contract is a diamond with multiple facets
    const { DiamondCutAccessControlFacet__factory } =
        await import('../../typechain-types')
    return getContract(
        DiamondCutAccessControlFacet__factory,
        diamondAddress,
        signer
    )
}
