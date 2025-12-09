import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BlockInfo } from './getAnchoredBlock'

export async function getLastAnchoredBlock(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    signatureProvider: ISignatureProvider
): Promise<BlockInfo> {
    console.log('📡 Querying last anchored block...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)

    try {
        const blockInfo =
            await anchoringCoreFacet.getLastAnchoredBlock(chainIdNum)

        if (
            !blockInfo ||
            blockInfo.blockNumber === 0n ||
            blockInfo.blockHash === hre.ethers.ZeroHash
        ) {
            throw new Error(`No anchored blocks found for chain ${chainid}`)
        }

        console.log('✅ Last anchored block found')
        console.log(`   Chain ID: ${chainid}`)
        console.log(`   Block Number: ${blockInfo.blockNumber}`)
        console.log(`   Block Hash: ${blockInfo.blockHash}`)
        console.log(`   State Root: ${blockInfo.stateRoot}`)
        console.log(`   Timestamp: ${blockInfo.timestamp}`)
        console.log(`   Anchorer: ${blockInfo.anchorer}`)

        return {
            blockNumber: blockInfo.blockNumber,
            blockHash: blockInfo.blockHash,
            stateRoot: blockInfo.stateRoot,
            timestamp: blockInfo.timestamp,
            anchorer: blockInfo.anchorer,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve last anchored block:', error)
        throw error
    }
}
