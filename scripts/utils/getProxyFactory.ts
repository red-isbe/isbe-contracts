import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getProxyFactory(factoryAddress: string, signer: Signer) {
    const { IProxyFactory__factory } = await import('../../typechain-types')
    return getContract(IProxyFactory__factory, factoryAddress, signer)
}
