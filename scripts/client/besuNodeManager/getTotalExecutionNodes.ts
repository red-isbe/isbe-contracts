import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getBesuNodeManager } from '../../utils/getBesuNodeManager'
import { IBesuNodeManager } from '../../../typechain-types'

export async function getTotalExecutionNodes(
    besuNodeManagerAddress: string,
    state: number,
    signer: Signer
): Promise<{
    ExecutionNodesLength: bigint
}> {
    if (!isValidBytesAndLength(besuNodeManagerAddress, 20))
        throw new Error(
            'Invalid besu node manager address format : ' +
                besuNodeManagerAddress
        )

    const besuNodeManager = (await getBesuNodeManager(
        besuNodeManagerAddress,
        signer
    )) as IBesuNodeManager

    const result = await besuNodeManager.getTotalExecutionNodes(state)

    return {
        ExecutionNodesLength: result,
    }
}
