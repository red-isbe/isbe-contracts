import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getTrustedIssuersRegistry(
    diamondAddress: string,
    signer: Signer
) {
    // Use the specific facet factory since the deployed contract is a diamond with multiple facets
    const { TrustedIssuersRegistryFacet__factory } =
        await import('../../typechain-types')
    return getContract(
        TrustedIssuersRegistryFacet__factory,
        diamondAddress,
        signer
    )
}
