import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getPause(diamondAddress: string, signer: Signer) {
    // Use the specific facet factory since the deployed contract is a diamond with multiple facets
    const { ISBEPauseFacet__factory } = await import('../../typechain-types')
    return getContract(ISBEPauseFacet__factory, diamondAddress, signer)
}
