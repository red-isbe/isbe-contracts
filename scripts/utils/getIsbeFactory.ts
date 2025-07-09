import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getIsbeFactory(factoryAddress: string, signer: Signer) {
    const { IIsbeFactory__factory } = await import('../../typechain-types')

    return getContract(IIsbeFactory__factory, factoryAddress, signer)
}
