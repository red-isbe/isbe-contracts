import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getGlobalIsbePause(
    factoryAddress: string,
    signer: Signer
) {
    const { IGlobalIsbePause__factory } = await import('../../typechain-types')

    return getContract(IGlobalIsbePause__factory, factoryAddress, signer)
}
