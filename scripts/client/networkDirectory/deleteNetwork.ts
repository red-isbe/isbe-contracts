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
import { getEvent } from '../../../scripts/utils/getEvent'
import { decodeError } from '../../../scripts/utils/translateCustomError'
import { ISignatureProvider } from '../../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    Signer,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'NetworkDirectoryFacet'
const EVENT_NAME = 'NetworkDeleted'

// ANSI color codes
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

export interface NetworkDeletedResult {
    chainId: bigint
}

/**
 * Delete network using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function deleteNetwork(
    hre: HardhatRuntimeEnvironment,
    chainId: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<NetworkDeletedResult> {
    console.log(
        `🌐 Using ${signatureProvider.getCurveType()} signature for network deletion...`
    )

    const normalizedChainId = BigInt(chainId)

    // For secp256r1, use raw transactions
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await deleteNetworkWithRawTransaction(
            hre,
            normalizedChainId,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const networkDirectory = await getNetworkDirectory(diamond, signer)

    console.log('📡 Sending deleteNetwork transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await networkDirectory.deleteNetwork(normalizedChainId)
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        if (error?.data) {
            console.log(
                'Transaction SEND failed: ' +
                    RED +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    RESET
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
        networkDirectory
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (typeof args.chainId !== 'bigint') {
        throw new Error('Invalid NetworkDeleted event args format')
    }

    const { chainId: evChainId } = args

    if (evChainId !== normalizedChainId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Network deleted successfully:`)
    console.log(`   Chain ID: ${evChainId}`)

    return {
        chainId: evChainId,
    }
}

/**
 * Delete network using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function deleteNetworkWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    chainId: bigint,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<NetworkDeletedResult> {
    const { NetworkDirectoryFacet__factory } =
        await import('../../../typechain-types')

    const contractInterface = NetworkDirectoryFacet__factory.createInterface()

    // Encode the deleteNetwork function call
    const functionData = contractInterface.encodeFunctionData('deleteNetwork', [
        chainId,
    ])

    console.log('📡 Sending deleteNetwork raw transaction...')

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
            gasLimit: 200000n, // Reasonable gas limit for deleteNetwork
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        if (error?.data) {
            console.log(
                '   ❌ Error: ' +
                    RED +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    RESET +
                    '\n'
            )
        }
        throw new Error(
            `Failed to submit deleteNetwork raw transaction: ${
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

    // Parse NetworkDeleted event from the receipt
    const networkDeletedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!networkDeletedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = networkDeletedEvent.args

    if (typeof args.chainId !== 'bigint') {
        throw new Error('Invalid NetworkDeleted event args format')
    }

    const { chainId: evChainId } = args

    if (evChainId !== chainId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Network deleted successfully:`)
    console.log(`   Chain ID: ${evChainId}`)

    return {
        chainId: evChainId,
    }
}

/**
 * Helper to get NetworkDirectory contract instance
 */
async function getNetworkDirectory(diamond: string, signer: Signer) {
    const { NetworkDirectoryFacet__factory } =
        await import('../../../typechain-types')
    return NetworkDirectoryFacet__factory.connect(diamond, signer)
}
