import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getAccessControl(diamondAddress: string, signer: Signer) {
    const { IAccessControl__factory } = await import('../../typechain-types')
    return getContract(IAccessControl__factory, diamondAddress, signer)
}
