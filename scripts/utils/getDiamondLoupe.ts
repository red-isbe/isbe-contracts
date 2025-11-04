import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondLoupe(diamondAddress: string, signer: Signer) {
    // Use the specific facet factory since the deployed contract is a diamond with multiple facets
    const { DiamondLoupeFacet__factory } = await import('../../typechain-types')
    return getContract(DiamondLoupeFacet__factory, diamondAddress, signer)
}
