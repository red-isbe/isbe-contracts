import { Signer } from 'ethers'
import { getContract } from './getContract'
import { isValidBytesAndLength } from './validation'

export async function getIsbeFactory(factoryAddress: string, signer: Signer) {
    if (!isValidBytesAndLength(factoryAddress, 20))
        throw new Error('Invalid factory address format : ' + factoryAddress)
    const { IIsbeFactory__factory } = await import('../../typechain-types')

    return getContract(IIsbeFactory__factory, factoryAddress, signer)
}
