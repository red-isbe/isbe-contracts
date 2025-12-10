import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export interface BlockInfo {
    blockNumber: bigint
    blockHash: string
    stateRoot: string
    timestamp: bigint
    anchorer: string
}

export async function getAnchoredBlock(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    blocknumber: string,
    signatureProvider: ISignatureProvider
): Promise<BlockInfo> {
    console.log('📡 Querying anchored block information...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const blockNumberNum = Number(blocknumber)

    try {
        const blockInfo = await anchoringCoreFacet.getAnchoredBlock(
            chainIdNum,
            blockNumberNum
        )

        if (
            !blockInfo ||
            blockInfo.blockNumber === 0n ||
            blockInfo.blockHash === hre.ethers.ZeroHash
        ) {
            throw new Error(
                `Block ${blocknumber} from chain ${chainid} not found or not anchored`
            )
        }

        console.log('✅ Anchored block found')
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
        console.error('❌ Failed to retrieve anchored block:', error)
        throw error
    }
}
