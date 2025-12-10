import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BlockInfo } from './getAnchoredBlock'

export async function getLastNBlocks(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    count: string,
    signatureProvider: ISignatureProvider
): Promise<BlockInfo[]> {
    console.log('📡 Querying last N blocks...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const countNum = Number(count)

    try {
        const result = await anchoringCoreFacet.getLastNBlocks(
            chainIdNum,
            countNum
        )

        console.log(`✅ Retrieved ${result.length} blocks`)
        console.log(`   Chain ID: ${chainid}`)
        console.log(`   Count: ${count}`)

        return result.map((block) => ({
            blockNumber: block.blockNumber,
            blockHash: block.blockHash,
            stateRoot: block.stateRoot,
            timestamp: block.timestamp,
            anchorer: block.anchorer,
        }))
    } catch (error) {
        console.error('❌ Failed to retrieve last N blocks:', error)
        throw error
    }
}
