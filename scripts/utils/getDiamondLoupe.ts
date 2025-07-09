import { Signer } from 'ethers'
import { getContract } from './getContract'
import { isValidBytesAndLength } from './validation'

export async function getDiamondLoupe(diamondAddress: string, signer: Signer) {
    if (!isValidBytesAndLength(diamondAddress, 20))
        throw new Error('Invalid diamond address format : ' + diamondAddress)

    const { IDiamondLoupe__factory } = await import('../../typechain-types')
    return getContract(IDiamondLoupe__factory, diamondAddress, signer)
}
