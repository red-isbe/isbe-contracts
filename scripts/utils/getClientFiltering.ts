import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getClientFiltering(
    clientFilteringAddress: string,
    signer: Signer
) {
    const { IClientFiltering__factory } = await import('../../typechain-types')
    return getContract(
        IClientFiltering__factory,
        clientFilteringAddress,
        signer
    )
}
