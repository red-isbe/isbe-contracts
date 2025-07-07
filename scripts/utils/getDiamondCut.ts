import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondCut(factoryAddress: string, signer: Signer) {
    const { IDiamondCut__factory } = await import('../../typechain-types')
    return getContract(IDiamondCut__factory, factoryAddress, signer)
}
