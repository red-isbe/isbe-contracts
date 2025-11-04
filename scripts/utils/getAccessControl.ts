import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getAccessControl(diamondAddress: string, signer: Signer) {
    // Use the actual governance facet interface deployed in the diamond
    const { AccessControlGovernanceFacet__factory } = await import(
        '../../typechain-types'
    )
    return getContract(
        AccessControlGovernanceFacet__factory,
        diamondAddress,
        signer
    )
}
