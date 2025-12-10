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
const EVENT_NAME = 'BlockAnchored'

export interface BlockAnchoredResult {
    blockNumber: bigint
    blockHash: string
    stateRoot: string
    chainId: bigint
    timestamp: bigint
    anchorer: string
}

export async function anchorBlock(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    blocknumber: string,
    blockhash: string,
    stateroot: string,
    signatureProvider: ISignatureProvider
): Promise<BlockAnchoredResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for block anchoring...`
    )

    const chainIdNum = Number(chainid)
    const blockNumberNum = Number(blocknumber)

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await anchorBlockWithRawTransaction(
            hre,
            chainIdNum,
            blockNumberNum,
            blockhash,
            stateroot,
            governancediamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    console.log('📡 Sending anchorBlock transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await anchoringCoreFacet.anchorBlock(
            chainIdNum,
            blockNumberNum,
            blockhash,
            stateroot
        )
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        if (error?.data) {
            console.log(
                'Transaction SEND failed: ' +
                    (await decodeError(hre, CONTRACT_NAME, error.data))
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
        typeof args.blockNumber !== 'bigint' ||
        typeof args.blockHash !== 'string' ||
        typeof args.stateRoot !== 'string' ||
        typeof args.chainId !== 'bigint' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.anchorer !== 'string'
    ) {
        throw new Error('Invalid BlockAnchored event args format')
    }

    const {
        blockNumber: evBlockNumber,
        blockHash: evBlockHash,
        stateRoot: evStateRoot,
        chainId: evChainId,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    } = args

    if (
        evChainId !== BigInt(chainIdNum) ||
        evBlockNumber !== BigInt(blockNumberNum)
    ) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Block anchored successfully:`)
    console.log(`   Chain ID: ${evChainId}`)
    console.log(`   Block Number: ${evBlockNumber}`)
    console.log(`   Block Hash: ${evBlockHash}`)
    console.log(`   State Root: ${evStateRoot}`)
    console.log(`   Timestamp: ${evTimestamp}`)
    console.log(`   Anchorer: ${evAnchorer}`)

    return {
        blockNumber: evBlockNumber,
        blockHash: evBlockHash,
        stateRoot: evStateRoot,
        chainId: evChainId,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    }
}

/**
 * Anchor block using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function anchorBlockWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    chainIdNum: number,
    blockNumberNum: number,
    blockhash: string,
    stateroot: string,
    governancediamond: string,
    signatureProvider: ISignatureProvider
): Promise<BlockAnchoredResult> {
    const { IAnchoringCore__factory } = await import('../../../typechain-types')

    const contractInterface = IAnchoringCore__factory.createInterface()

    // Encode the anchorBlock function call
    const functionData = contractInterface.encodeFunctionData('anchorBlock', [
        chainIdNum,
        blockNumberNum,
        blockhash,
        stateroot,
    ])

    console.log('📡 Sending anchorBlock raw transaction...')

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
            gasLimit: 500000n, // Reasonable gas limit for anchorBlock
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        if (error?.data) {
            console.log(
                '   ❌ Error: ' +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    '\n'
            )
        }
        throw new Error(
            `Failed to submit anchorBlock raw transaction: ${
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

    // Parse BlockAnchored event from the receipt
    const blockAnchoredEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!blockAnchoredEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = blockAnchoredEvent.args

    if (
        typeof args.blockNumber !== 'bigint' ||
        typeof args.blockHash !== 'string' ||
        typeof args.stateRoot !== 'string' ||
        typeof args.chainId !== 'bigint' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.anchorer !== 'string'
    ) {
        throw new Error('Invalid BlockAnchored event args format')
    }

    const {
        blockNumber: evBlockNumber,
        blockHash: evBlockHash,
        stateRoot: evStateRoot,
        chainId: evChainId,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    } = args

    if (
        evChainId !== BigInt(chainIdNum) ||
        evBlockNumber !== BigInt(blockNumberNum)
    ) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Block anchored successfully:`)
    console.log(`   Chain ID: ${evChainId}`)
    console.log(`   Block Number: ${evBlockNumber}`)
    console.log(`   Block Hash: ${evBlockHash}`)
    console.log(`   State Root: ${evStateRoot}`)
    console.log(`   Timestamp: ${evTimestamp}`)
    console.log(`   Anchorer: ${evAnchorer}`)

    return {
        blockNumber: evBlockNumber,
        blockHash: evBlockHash,
        stateRoot: evStateRoot,
        chainId: evChainId,
        timestamp: evTimestamp,
        anchorer: evAnchorer,
    }
}
