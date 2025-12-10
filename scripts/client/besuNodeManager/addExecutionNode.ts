import { getBesuNodeManager } from '../../../scripts/utils/getBesuNodeManager'
import { getEvent } from '../../../scripts/utils/getEvent'
import { decodeError } from '../../../scripts/utils/translateCustomError'
import { ISignatureProvider } from '../../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'ExecutionNodeManager'
const EVENT_NAME = 'ExecutionNodeAdded'

export interface ExecutionNodeAddedResult {
    nodeId: string
    enode: string
    timestamp: bigint
    state: bigint
}

export async function addExecutionNode(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    enode: string
): Promise<ExecutionNodeAddedResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for execution node management...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await addExecutionNodeWithRawTransaction(
            hre,
            enode,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const besuNodeManager = await getBesuNodeManager(diamond, signer)

    console.log('📡 Sending addExecutionNode transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await besuNodeManager.addExecutionNode(enode)
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
        besuNodeManager
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (
        typeof args.nodeId !== 'string' ||
        typeof args.enode !== 'string' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.state !== 'bigint'
    ) {
        throw new Error('Invalid ExecutionNodeAdded event args format')
    }

    const {
        nodeId: evNodeId,
        enode: evEnode,
        timestamp: evTimestamp,
        state: evState,
    } = args

    if (evEnode !== enode) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    return {
        nodeId: evNodeId,
        enode: evEnode,
        timestamp: evTimestamp,
        state: evState,
    }
}

/**
 * Add execution node using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function addExecutionNodeWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    enode: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<ExecutionNodeAddedResult> {
    const { ExecutionNodeManager__factory } =
        await import('../../../typechain-types')

    const contractInterface = ExecutionNodeManager__factory.createInterface()

    // Encode the addExecutionNode function call
    const functionData = contractInterface.encodeFunctionData(
        'addExecutionNode',
        [enode]
    )

    console.log('📡 Sending addExecutionNode raw transaction...')

    let txResponse
    try {
        // FIRST simulate tx to catch errors early and avoid gas costs
        await hre.ethers.provider.call({
            to: diamond,
            from: await signatureProvider.getAddress(),
            data: functionData,
        })

        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 400000n, // Reasonable gas limit for addExecutionNode
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
            `Failed to submit addExecutionNode raw transaction: ${
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

    // Parse ExecutionNodeAdded event from the receipt
    const executionNodeAddedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!executionNodeAddedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = executionNodeAddedEvent.args

    if (
        typeof args.nodeId !== 'string' ||
        typeof args.enode !== 'string' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.state !== 'bigint'
    ) {
        throw new Error('Invalid ExecutionNodeAdded event args format')
    }

    const {
        nodeId: evNodeId,
        enode: evEnode,
        timestamp: evTimestamp,
        state: evState,
    } = args

    if (evEnode !== enode) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    return {
        nodeId: evNodeId,
        enode: evEnode,
        timestamp: evTimestamp,
        state: evState,
    }
}
