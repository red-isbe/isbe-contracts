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

const CONTRACT_NAME = 'ValidatorManager'
const STANDBY_EVENT_NAME = 'ValidatorStandby'

export async function standbyValidator(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    nodeId: string
): Promise<string> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for validator standby...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await standbyValidatorWithRawTransaction(
            hre,
            nodeId,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const besuNodeManager = await getBesuNodeManager(diamond, signer)

    console.log('📡 Sending standbyValidator transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await besuNodeManager.standbyValidator(nodeId)
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error: any) {
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
        STANDBY_EVENT_NAME,
        tx,
        besuNodeManager
    )

    if (!logDescription) {
        throw new Error(
            `${STANDBY_EVENT_NAME} event not found in transaction logs`
        )
    }

    const args = logDescription.args

    if (typeof args.nodeId !== 'string') {
        throw new Error('Invalid ValidatorStandby event args format')
    }

    const { nodeId: evNodeId } = args

    return evNodeId
}

/**
 * Move validator to standby using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function standbyValidatorWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    nodeId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<string> {
    const { ValidatorManager__factory } = await import(
        '../../../typechain-types'
    )

    const contractInterface = ValidatorManager__factory.createInterface()

    // Encode the standbyValidator function call
    const functionData = contractInterface.encodeFunctionData(
        'standbyValidator',
        [nodeId]
    )

    console.log('📡 Sending standbyValidator raw transaction...')

    let txResponse: any
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
            gasLimit: 200000n,
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error: any) {
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
            `Failed to submit standbyValidator raw transaction: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
    }

    console.log('⏳ Waiting for raw transaction to be mined...')
    let receipt: any
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

    // Parse ValidatorStandby event from the receipt
    const validatorStandbyEvent = receipt.logs
        .map((log: any) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log: any) => log && log.name === STANDBY_EVENT_NAME)

    if (!validatorStandbyEvent) {
        throw new Error(
            `${STANDBY_EVENT_NAME} event not found in transaction receipt`
        )
    }

    const args = validatorStandbyEvent.args

    if (typeof args.nodeId !== 'string') {
        throw new Error('Invalid ValidatorStandby event args format')
    }

    const { nodeId: evNodeId } = args

    return evNodeId
}
