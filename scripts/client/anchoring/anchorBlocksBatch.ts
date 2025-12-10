import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { getEvent } from '../../../scripts/utils/getEvent'
import { decodeError } from '../../../scripts/utils/translateCustomError'
import { ISignatureProvider } from '../../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'AnchoringCoreFacet'
const EVENT_NAME = 'BlocksBatchAnchored'

export interface BlocksBatchAnchoredResult {
    chainId: bigint
    blockCount: bigint
    firstBlock: bigint
    lastBlock: bigint
    timestamp: bigint
    anchorer: string
}

export async function anchorBlocksBatch(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    blockNumbersArr: string[],
    blockHashesArr: string[],
    stateRootsArr: string[],
    signatureProvider: ISignatureProvider
): Promise<BlocksBatchAnchoredResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for batch anchoring...`
    )

    const chainIdNum = Number(chainid)
    const blockNumbersNum = blockNumbersArr.map((n) => Number(n))

    console.log('\n📋 anchorBlocksBatch parameters:')
    console.log('  governancediamond:', governancediamond)
    console.log(`  chainid: ${chainIdNum}`)
    console.log(`  blockNumbers: [${blockNumbersNum.join(', ')}]`)
    console.log(`  blockHashes: ${blockHashesArr.length} items`)
    console.log(`  stateRoots: ${stateRootsArr.length} items`)

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await anchorBlocksBatchWithRawTransaction(
            hre,
            chainIdNum,
            blockNumbersNum,
            blockHashesArr,
            stateRootsArr,
            governancediamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    console.log('📡 Sending anchorBlocksBatch transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await anchoringCoreFacet.anchorBlocksBatch(
            chainIdNum,
            blockNumbersNum,
            blockHashesArr,
            stateRootsArr
        )
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        if (error?.data) {
            console.log(
                'Transaction SEND failed: \x1b[0;31m' +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    '\x1b[0m'
            )
        } else {
            console.log('Transaction SEND failed: ' + error)
        }
        throw error
    }

    console.log('⏳ Waiting for transaction to be mined...')
    let receipt: TransactionReceipt | null
    try {
        receipt = await tx.wait()
        if (!receipt) throw new Error('Transaction receipt is null')
        if (receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        console.log('Transaction MINING failed: ' + error)
        throw error
    }

    const logDescription: LogDescription | null = await getEvent(
        EVENT_NAME,
        tx,
        anchoringCoreFacet
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (
        typeof args.chainId !== 'bigint' ||
        typeof args.blockCount !== 'bigint' ||
        typeof args.firstBlock !== 'bigint' ||
        typeof args.lastBlock !== 'bigint' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.anchorer !== 'string'
    ) {
        throw new Error('Invalid BlocksBatchAnchored event args format')
    }

    const {
        chainId: evChainId,
        blockCount: evBlockCount,
        firstBlock: evFirstBlock,
        lastBlock: evLastBlock,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    } = args

    if (evChainId !== BigInt(chainIdNum)) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Batch anchored successfully:`)
    console.log(`   Chain ID: ${evChainId}`)
    console.log(`   Block Count: ${evBlockCount}`)
    console.log(`   Range: ${evFirstBlock} - ${evLastBlock}`)
    console.log(`   Timestamp: ${evTimestamp}`)
    console.log(`   Anchorer: ${evAnchorer}`)

    return {
        chainId: evChainId,
        blockCount: evBlockCount,
        firstBlock: evFirstBlock,
        lastBlock: evLastBlock,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    }
}

/**
 * Anchor blocks batch using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function anchorBlocksBatchWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    chainIdNum: number,
    blockNumbersNum: number[],
    blockHashesArr: string[],
    stateRootsArr: string[],
    governancediamond: string,
    signatureProvider: ISignatureProvider
): Promise<BlocksBatchAnchoredResult> {
    const { IAnchoringCore__factory } = await import('../../../typechain-types')

    const contractInterface = IAnchoringCore__factory.createInterface()

    // Encode the anchorBlocksBatch function call
    const functionData = contractInterface.encodeFunctionData(
        'anchorBlocksBatch',
        [chainIdNum, blockNumbersNum, blockHashesArr, stateRootsArr]
    )

    console.log('📡 Sending anchorBlocksBatch raw transaction...')

    let txResponse
    try {
        // FIRST simulate tx to catch errors early and avoid gas costs
        await hre.ethers.provider.call({
            to: governancediamond,
            from: await signatureProvider.getAddress(),
            data: functionData,
        })

        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: governancediamond,
            data: functionData,
            gasLimit: 1000000n, // Higher gas limit for batch operation
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        if (error?.data) {
            console.log(
                '   ❌ Error: \x1b[0;31m' +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    '\x1b[0m'
            )
        }
        throw new Error(
            `Failed to submit anchorBlocksBatch raw transaction: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
    }

    console.log('⏳ Waiting for raw transaction to be mined...')
    let receipt
    try {
        receipt = await txResponse.wait()
        if (!receipt || receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        console.log(`❌ Raw transaction failed to mine`)
        console.log(`   🔗 Transaction Hash: ${txResponse.hash}`)
        throw error
    }

    // Parse BlocksBatchAnchored event from the receipt
    const blocksBatchAnchoredEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!blocksBatchAnchoredEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = blocksBatchAnchoredEvent.args

    if (
        typeof args.chainId !== 'bigint' ||
        typeof args.blockCount !== 'bigint' ||
        typeof args.firstBlock !== 'bigint' ||
        typeof args.lastBlock !== 'bigint' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.anchorer !== 'string'
    ) {
        throw new Error('Invalid BlocksBatchAnchored event args format')
    }

    const {
        chainId: evChainId,
        blockCount: evBlockCount,
        firstBlock: evFirstBlock,
        lastBlock: evLastBlock,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    } = args

    if (evChainId !== BigInt(chainIdNum)) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Batch anchored successfully:`)
    console.log(`   Chain ID: ${evChainId}`)
    console.log(`   Block Count: ${evBlockCount}`)
    console.log(`   Range: ${evFirstBlock} - ${evLastBlock}`)
    console.log(`   Timestamp: ${evTimestamp}`)
    console.log(`   Anchorer: ${evAnchorer}`)

    return {
        chainId: evChainId,
        blockCount: evBlockCount,
        firstBlock: evFirstBlock,
        lastBlock: evLastBlock,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    }
}
