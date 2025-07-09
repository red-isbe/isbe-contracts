import { Signer } from 'ethers'
import { getContract } from './getContract'
import { isValidBytesAndLength } from './validation'

export async function getDiamondCut(diamondAddress: string, signer: Signer) {
    if (!isValidBytesAndLength(diamondAddress, 20))
        throw new Error('Invalid diamond address format : ' + diamondAddress)
    const { IDiamondCut__factory } = await import('../../typechain-types')
    return getContract(IDiamondCut__factory, diamondAddress, signer)
}
