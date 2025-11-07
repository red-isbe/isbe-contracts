import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getBesuNodeManager } from '../../utils/getBesuNodeManager'
import { IBesuNodeManager } from '../../../typechain-types'

export async function getValidatorState(
    besuNodeManagerAddress: string,
    nodeId: string,
    signer: Signer
): Promise<bigint> {
    if (!isValidBytesAndLength(besuNodeManagerAddress, 20))
        throw new Error('Invalid besu node manager address format.')

    const besuNodeManager = (await getBesuNodeManager(
        besuNodeManagerAddress,
        signer
    )) as IBesuNodeManager

    return await besuNodeManager.getValidatorState(nodeId)
}
