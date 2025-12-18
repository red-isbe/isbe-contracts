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

import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { getTimeStampingRegistry } from './utils'
import { decodeError } from '../../../scripts/utils/translateCustomError'
import { getEvent } from '../../../scripts/utils/getEvent'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'TimeStampingRegistryFacet'
const EVENT_NAME = 'Stamped'

export interface StampedResult {
    originalHash: string
    tsaHash: string
    externalReferenceId: string
}

export async function stamp(
    hre: HardhatRuntimeEnvironment,
    originalHash: string,
    tsaHash: string,
    externalReferenceId: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<StampedResult> {
    console.log('🔏 Initializing signature provider for stamping...')

    console.log('📋 Stamping with parameters:')
    console.log(`   Original Hash: ${originalHash}`)
    console.log(`   TSA Hash: ${tsaHash}`)
    console.log(`   External Reference ID: ${externalReferenceId}`)
    console.log(`   Diamond: ${diamond}`)
    console.log(`   Curve: ${signatureProvider.getCurveType()}`)

    const args = [originalHash, tsaHash, externalReferenceId]
    let tx
    let contract
    if (signatureProvider.getCurveType() === 'secp256r1') {
        // Use raw transaction for secp256r1
        const { TimeStampingRegistryFacet__factory } =
            await import('../../../typechain-types')
        const contractInterface =
            TimeStampingRegistryFacet__factory.createInterface()
        const functionData = contractInterface.encodeFunctionData('stamp', args)
        console.log('📡 Sending stamp raw transaction...')
        try {
            // Simulate call first
            await hre.ethers.provider.call({
                to: diamond,
                from: await signatureProvider.getAddress(),
                data: functionData,
            })
            tx = await signatureProvider.sendTransaction({
                to: diamond,
                data: functionData,
                gasLimit: 200000n,
            })
            console.log(`   🔗 Transaction submitted: ${tx.hash}`)
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
                `Failed to submit stamp raw transaction: ${
                    error instanceof Error ? error.message : String(error)
                }`
            )
        }
        contract = { interface: contractInterface }
    } else {
        // secp256k1: use contract interface
        const signer = await signatureProvider.getSigner()
        contract = await getTimeStampingRegistry(diamond, signer)
        try {
            tx = await contract.stamp(...args)
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
    }

    console.log('⏳ Waiting for transaction to be mined...')
    let receipt
    try {
        receipt = await tx.wait()
        if (!receipt || receipt.status !== 1) {
            // Intentar decodificar el error revertido si está disponible
            if (receipt && receipt.logs && receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                    if (log.data) {
                        try {
                            const decoded = await decodeError(
                                hre,
                                CONTRACT_NAME,
                                log.data
                            )
                            console.log('⛔ Revert reason:', decoded)
                        } catch {
                            // No se pudo decodificar este log
                        }
                    }
                }
            }
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        // Si el error tiene data, intentar decodificar
        if (error && error.data) {
            try {
                const decoded = await decodeError(
                    hre,
                    CONTRACT_NAME,
                    error.data
                )
                console.log('⛔ Revert reason:', decoded)
            } catch {
                // No se pudo decodificar
            }
        }
        console.log('Transaction MINING failed: ' + error)
        throw error
    }

    // Parse Stamped event
    let logDescription
    if (contract.interface.parseLog) {
        // Use getEvent util for ethers contract
        logDescription = await getEvent(EVENT_NAME, tx, contract)
    } else {
        // For raw tx, parse logs manually
        logDescription = receipt.logs
            .map((log) => {
                try {
                    return contract.interface.parseLog(log)
                } catch {
                    return null
                }
            })
            .find((log) => log && log.name === EVENT_NAME)
    }

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const evArgs = logDescription.args
    if (
        typeof evArgs.originalHash !== 'string' ||
        typeof evArgs.tsaHash !== 'string' ||
        typeof evArgs.externalReferenceId !== 'string'
    ) {
        throw new Error('Invalid Stamped event args format')
    }

    console.log(`\n✅ Hash set stamped successfully:`)
    console.log(`   Original Hash: ${evArgs.originalHash}`)
    console.log(`   TSA Hash: ${evArgs.tsaHash}`)
    console.log(`   External Reference ID: ${evArgs.externalReferenceId}`)

    return {
        originalHash: evArgs.originalHash,
        tsaHash: evArgs.tsaHash,
        externalReferenceId: evArgs.externalReferenceId,
    }
}
