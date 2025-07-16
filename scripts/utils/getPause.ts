import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getPause(diamondAddress: string, signer: Signer) {
    const { IPause__factory } = await import('../../typechain-types')
    return getContract(IPause__factory, diamondAddress, signer)
}
