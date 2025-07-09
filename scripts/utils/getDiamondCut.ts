import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondCut(diamondAddress: string, signer: Signer) {
    const { IDiamondCut__factory } = await import('../../typechain-types')
    return getContract(IDiamondCut__factory, diamondAddress, signer)
}
