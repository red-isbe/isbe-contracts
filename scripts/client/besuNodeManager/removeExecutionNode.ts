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
const EVENT_NAME = 'ExecutionNodeRemoved'

export async function removeExecutionNode(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    besuNodeId: string
): Promise<string> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role granting...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await removeExecutionNodeWithRawTransaction(
            hre,
            besuNodeId,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const besuNodeManager = await getBesuNodeManager(diamond, signer)

    console.log('📡 Sending removeExecutionNode transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await besuNodeManager.removeExecutionNode(besuNodeId)
    } catch (error) {
        if (error.data) {
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
    } catch (error) {
        //include correct error handling
        console.log('Transaction MINING failed: ' + error)
        throw error
    }

    const logDescription: LogDescription = await getEvent(
        EVENT_NAME,
        tx,
        besuNodeManager
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const { nodeId } = logDescription.args

    if (nodeId !== besuNodeId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly. '
        )
    }

    return nodeId
}

/**
 * Revoke role using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function removeExecutionNodeWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    besuNodeId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<string> {
    // Import AccessControl interface for encoding function data
    const { ExecutionNodeManager__factory } = await import(
        '../../../typechain-types'
    )

    // Create interface for encoding function data
    const contractInterface = ExecutionNodeManager__factory.createInterface()

    // Encode the revokeRole function call
    const functionData = contractInterface.encodeFunctionData(
        'removeExecutionNode',
        [besuNodeId]
    )

    console.log('📡 Sending revokeRole raw transaction...')

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
            gasLimit: 200000n, // Reasonable gas limit for revokeRole
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        if (error.data) {
            console.log(
                '   ❌ Error: ' +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    '\n'
            )
        }
        throw new Error(
            `Failed to submit revokeRole raw transaction: ${error instanceof Error ? error.message : String(error)}`
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

    // Parse RoleRevoked event from the receipt
    const roleRevokedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!roleRevokedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const { nodeId } = roleRevokedEvent.args

    if (nodeId !== besuNodeId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly. '
        )
    }

    return besuNodeId
}
