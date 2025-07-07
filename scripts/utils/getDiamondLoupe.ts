import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getDiamondLoupe(factoryAddress: string, signer: Signer) {
    const { IDiamondLoupe__factory } = await import('../../typechain-types')
    return getContract(IDiamondLoupe__factory, factoryAddress, signer)
}
