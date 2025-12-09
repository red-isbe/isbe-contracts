import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BlockInfo } from './getAnchoredBlock'

export async function getBlocksInRange(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    fromblock: string,
    toblock: string,
    signatureProvider: ISignatureProvider
): Promise<BlockInfo[]> {
    console.log('📡 Querying blocks in range...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const fromBlockNum = Number(fromblock)
    const toBlockNum = Number(toblock)

    try {
        const result = await anchoringCoreFacet.getBlocksInRange(
            chainIdNum,
            fromBlockNum,
            toBlockNum
        )

        console.log(`✅ Retrieved ${result.length} blocks in range`)
        console.log(`   Chain ID: ${chainid}`)
        console.log(`   From Block: ${fromblock}`)
        console.log(`   To Block: ${toblock}`)

        return result.map((block) => ({
            blockNumber: block.blockNumber,
            blockHash: block.blockHash,
            stateRoot: block.stateRoot,
            timestamp: block.timestamp,
            anchorer: block.anchorer,
        }))
    } catch (error) {
        console.error('❌ Failed to retrieve blocks in range:', error)
        throw error
    }
}
