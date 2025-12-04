import { ISignatureProvider } from '../../../tasks/index'
import { getBesuNodeManager } from '../../../scripts/utils/getBesuNodeManager'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export interface NodeDTO {
    nodeId: string
    enode: string
    timestamp: bigint
}

export async function getNode(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    signatureProvider: ISignatureProvider,
    nodeId: string
): Promise<NodeDTO> {
    console.log('📡 Querying node information...')

    // Use provider for read-only operations (no signer needed)
    const signer = await signatureProvider.getSigner()
    const besuNodeManager = await getBesuNodeManager(diamond, signer)

    try {
        const node = await besuNodeManager.getNode(nodeId)

        if (!node || !node.nodeId || node.nodeId === hre.ethers.ZeroHash) {
            throw new Error(
                `Node with ID ${nodeId} not found in any category (validator, boot node, or execution node)`
            )
        }

        console.log('✅ Node found')

        return {
            nodeId: node.nodeId,
            enode: node.enode,
            timestamp: node.timestamp,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve node:', error)
        throw error
    }
}
