import { Signer } from 'ethers'
import { getContract } from './getContract'
import { isValidBytesAndLength } from './validation'

export async function getPause(diamondAddress: string, signer: Signer) {
    if (!isValidBytesAndLength(diamondAddress, 20))
        throw new Error('Invalid diamond address format : ' + diamondAddress)
    const { IPause__factory } = await import('../../typechain-types')
    return getContract(IPause__factory, diamondAddress, signer)
}
