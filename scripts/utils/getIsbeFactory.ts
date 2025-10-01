import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getIsbeFactory(factoryAddress: string, signer: Signer) {
    // Use the combined IIsbeFactory interface that provides access to all facets
    const { IIsbeFactory__factory } = await import('../../typechain-types')
    return getContract(IIsbeFactory__factory, factoryAddress, signer)
}
