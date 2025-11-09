import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getBesuNodeManager(
    besuNodeManagerAddress: string,
    signer: Signer
) {
    const { IBesuNodeManager__factory } = await import('../../typechain-types')
    return getContract(
        IBesuNodeManager__factory,
        besuNodeManagerAddress,
        signer
    )
}
