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
-------------------------------------------------------------- */
import { getEvent } from '../utils/getEvent'
import { decodeError } from '../utils/translateCustomError'
import { ISignatureProvider } from '../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'DidControllerFacet'
const EVENT_NAME = 'ControllerAdded'

export interface ControllerAddedResult {
    did: string
    controller: string
}

async function loadDidControllerFactory() {
    const { DidControllerFacet__factory } =
        await import('../../typechain-types')
    return DidControllerFacet__factory
}

export async function addController(
    hre: HardhatRuntimeEnvironment,
    did: string,
    controller: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<ControllerAddedResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for adding controller...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await addControllerWithRawTransaction(
            hre,
            did,
            controller,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const DidControllerFacet__factory = await loadDidControllerFactory()
    const didControllerFacet = DidControllerFacet__factory.connect(
        diamond,
        signer
    )

    console.log('📡 Sending addController transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await didControllerFacet.addController(did, controller)
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
    } catch (error: any) {
        console.log('Transaction MINING failed: ' + error)
        throw error
    }

    const logDescription: LogDescription | null = await getEvent(
        EVENT_NAME,
        tx,
        didControllerFacet
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (typeof args.did !== 'string' || typeof args.controller !== 'string') {
        throw new Error('Invalid ControllerAdded event args format')
    }

    const { did: evDid, controller: evController } = args

    if (evDid !== did || evController !== controller) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Controller added successfully:`)
    console.log(`   DID: ${evDid}`)
    console.log(`   Controller: ${evController}`)

    return {
        did: evDid,
        controller: evController,
    }
}

/**
 * Add controller using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function addControllerWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    did: string,
    controller: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<ControllerAddedResult> {
    const { IDidController__factory } = await import('../../typechain-types')

    const contractInterface = IDidController__factory.createInterface()

    // Encode the addController function call
    const functionData = contractInterface.encodeFunctionData('addController', [
        did,
        controller,
    ])

    console.log('📡 Sending addController raw transaction...')

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
            gasLimit: 500000n, // Reasonable gas limit for addController
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
            `Failed to submit addController raw transaction: ${
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
    } catch (error: any) {
        console.log(`❌ Raw transaction failed to mine`)
        console.log(`   🔗 Transaction Hash: ${txResponse.hash}`)
        throw error
    }

    // Parse ControllerAdded event from the receipt
    const controllerAddedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!controllerAddedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = controllerAddedEvent.args

    if (typeof args.did !== 'string' || typeof args.controller !== 'string') {
        throw new Error('Invalid ControllerAdded event args format')
    }

    const { did: evDid, controller: evController } = args

    if (evDid !== did || evController !== controller) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Controller added successfully:`)
    console.log(`   DID: ${evDid}`)
    console.log(`   Controller: ${evController}`)

    return {
        did: evDid,
        controller: evController,
    }
}
