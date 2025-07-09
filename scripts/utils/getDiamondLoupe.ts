import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondLoupe(diamondAddress: string, signer: Signer) {
    const { IDiamondLoupe__factory } = await import('../../typechain-types')
    return getContract(IDiamondLoupe__factory, diamondAddress, signer)
}
