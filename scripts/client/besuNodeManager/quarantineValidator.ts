/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
const QUARANTINE_EVENT_NAME = 'ValidatorQuarantined'

export async function quarantineValidator(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    nodeId: string
): Promise<string> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for validator quarantine...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await quarantineValidatorWithRawTransaction(
            hre,
            nodeId,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const besuNodeManager = await getBesuNodeManager(diamond, signer)

    console.log('📡 Sending quarantineValidator transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await besuNodeManager.quarantineValidator(nodeId)
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
        QUARANTINE_EVENT_NAME,
        tx,
        besuNodeManager
    )

    if (!logDescription) {
        throw new Error(
            `${QUARANTINE_EVENT_NAME} event not found in transaction logs`
        )
    }

    const args = logDescription.args

    if (typeof args.nodeId !== 'string') {
        throw new Error('Invalid ValidatorQuarantined event args format')
    }

    const { nodeId: evNodeId } = args

    return evNodeId
}

/**
 * Quarantine validator using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function quarantineValidatorWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    nodeId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<string> {
    const { ValidatorManager__factory } =
        await import('../../../typechain-types')

    const contractInterface = ValidatorManager__factory.createInterface()

    // Encode the quarantineValidator function call
    const functionData = contractInterface.encodeFunctionData(
        'quarantineValidator',
        [nodeId]
    )

    console.log('📡 Sending quarantineValidator raw transaction...')

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
            gasLimit: 200000n,
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
            `Failed to submit quarantineValidator raw transaction: ${
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

    // Parse ValidatorQuarantined event from the receipt
    const validatorQuarantinedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === QUARANTINE_EVENT_NAME)

    if (!validatorQuarantinedEvent) {
        throw new Error(
            `${QUARANTINE_EVENT_NAME} event not found in transaction receipt`
        )
    }

    const args = validatorQuarantinedEvent.args

    if (typeof args.nodeId !== 'string') {
        throw new Error('Invalid ValidatorQuarantined event args format')
    }

    const { nodeId: evNodeId } = args

    return evNodeId
}
