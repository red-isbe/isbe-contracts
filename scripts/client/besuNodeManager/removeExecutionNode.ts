import { getBesuNodeManager } from '../../../scripts/utils/getBesuNodeManager'
import { getEvent } from '../../../scripts/utils/getEvent'
import { decodeError } from '../../../scripts/utils/translateCustomError'
import { isValidBytesAndLength } from '../../../scripts/utils/validation'
import { ISignatureProvider } from '../../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'ExecutionNodeManager'

export async function removeExecutionNode(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    besuNodeId: string
): Promise<string> {
    // Function implementation goes here
    if (!isValidBytesAndLength(besuNodeId, 32))
        throw new Error('Invalid role format: ' + besuNodeId)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role granting...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        throw new Error('secp256r1 is not supported for this operation.')
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
        if (error.data) {
            console.log(
                'Transaction MINING failed: ' +
                    (await decodeError(hre, CONTRACT_NAME, error.data))
            )
        } else {
            console.log('Transaction MINING failed: ' + error)
        }
        throw error
    }

    const logDescription: LogDescription = await getEvent(
        'ExecutionNodeRemoved',
        tx,
        besuNodeManager
    )

    if (!logDescription) {
        throw new Error(
            'ExecutionNodeRemoved event not found in transaction logs'
        )
    }

    const { nodeId } = logDescription.args

    if (nodeId !== besuNodeId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly. '
        )
    }

    return nodeId
}
