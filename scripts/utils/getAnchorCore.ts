import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getBesuNodeManager(
    besuNodeManagerAddress: string,
    signer: Signer
) {
    const { IAnchoringCore__factory } = await import('../../typechain-types')
    return getContract(
        IAnchoringCore__factory,
        besuNodeManagerAddress,
        signer
    )
}
