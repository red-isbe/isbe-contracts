import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BesuNodeManagerFacet__factory } from '../../../typechain-types'

export interface NodeDTO {
    nodeId: string
    enode: string
    timestamp: bigint
}

export async function getNode(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    nodeId: string
): Promise<NodeDTO> {
    console.log('📡 Querying node information...')

    // Use provider for read-only operations (no signer needed)
    const provider = hre.ethers.provider
    const besuNodeManager = BesuNodeManagerFacet__factory.connect(
        diamond,
        provider
    )

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
