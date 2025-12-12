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
const EVENT_NAME = 'ValidatorAdded'

export interface ValidatorAddedResult {
    nodeId: string
    enode: string
    timestamp: bigint
    state: bigint
}

export async function addValidator(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    enode: string
): Promise<ValidatorAddedResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for validator management...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await addValidatorWithRawTransaction(
            hre,
            enode,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const besuNodeManager = await getBesuNodeManager(diamond, signer)

    console.log('📡 Sending addValidator transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await besuNodeManager.addValidator(enode)
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
        typeof args.initialState !== 'bigint'
    ) {
        throw new Error('Invalid ValidatorAdded event args format')
    }

    const {
        nodeId: evNodeId,
        enode: evEnode,
        timestamp: evTimestamp,
        initialState: evState,
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
 * Add validator using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function addValidatorWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    enode: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<ValidatorAddedResult> {
    const { ValidatorManager__factory } =
        await import('../../../typechain-types')

    const contractInterface = ValidatorManager__factory.createInterface()

    // Encode the addValidator function call
    const functionData = contractInterface.encodeFunctionData('addValidator', [
        enode,
    ])

    console.log('📡 Sending addValidator raw transaction...')

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
            gasLimit: 400000n,
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
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
        receipt = await txResponse.wait()
        if (!receipt) throw new Error('Transaction receipt is null')
        if (receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        console.log('Transaction MINING failed: ' + error)
        throw error
    }

    // Parse event from receipt
    const eventLog = receipt.logs.find((log) => {
        try {
            const parsed = contractInterface.parseLog({
                topics: [...log.topics],
                data: log.data,
            })
            return parsed?.name === EVENT_NAME
        } catch {
            return false
        }
    })

    if (!eventLog) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const parsedLog = contractInterface.parseLog({
        topics: [...eventLog.topics],
        data: eventLog.data,
    })

    if (!parsedLog) {
        throw new Error(`Could not parse ${EVENT_NAME} event`)
    }

    const args = parsedLog.args

    if (
        typeof args.nodeId !== 'string' ||
        typeof args.enode !== 'string' ||
        typeof args.timestamp !== 'bigint' ||
        typeof args.initialState !== 'bigint'
    ) {
        throw new Error('Invalid ValidatorAdded event args format')
    }

    const {
        nodeId: evNodeId,
        enode: evEnode,
        timestamp: evTimestamp,
        initialState: evState,
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
