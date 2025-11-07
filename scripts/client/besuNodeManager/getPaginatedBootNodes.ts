import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getBesuNodeManager } from '../../utils/getBesuNodeManager'
import { IBesuNodeManager } from '../../../typechain-types'
import { NodeDTOStructOutput } from '../../../typechain-types/contracts/client/besuNodeManager/IBesuNodeManager'

export async function getPaginatedBootNodes(
    besuNodeManagerAddress: string,
    state: number,
    pageSize: number,
    pageIndex: number,
    signer: Signer
): Promise<{ BootNodes: NodeDTOStructOutput[] }> {
    if (!isValidBytesAndLength(besuNodeManagerAddress, 20))
        throw new Error('Invalid besu node manager address format.')

    const besuNodeManager = (await getBesuNodeManager(
        besuNodeManagerAddress,
        signer
    )) as IBesuNodeManager

    return {
        BootNodes: await besuNodeManager.getPaginatedBootNodes(
            state,
            pageSize,
            pageIndex
        ),
    }
}
