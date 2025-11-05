import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getBesuNodeManager } from '../../utils/getBesuNodeManager'
import { IBesuNodeManager } from '../../../typechain-types'

export async function getTotalBootNodes(
    besuNodeManagerAddress: string,
    state: number,
    signer: Signer
): Promise<{
    BootNodesLength: bigint
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

    const result = await besuNodeManager.getTotalBootNodes(state)

    return {
        BootNodesLength: result,
    }
}
