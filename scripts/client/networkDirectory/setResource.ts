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
    ethers,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'NetworkDirectoryFacet'
const EVENT_NAME = 'ResourceSet'

// ANSI color codes
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

export interface ResourceSetResult {
    chainId: bigint
    resourceId: string
    resource: string
}

/**
 * Set resource using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function setResource(
    hre: HardhatRuntimeEnvironment,
    chainId: bigint | number,
    resourceId: string,
    resource: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<ResourceSetResult> {
    console.log(
        `🌐 Using ${signatureProvider.getCurveType()} signature for resource setting...`
    )

    const normalizedChainId = BigInt(chainId)
    const resourceIdBytes32 = ethers.encodeBytes32String(resourceId)

    // For secp256r1, use raw transactions
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await setResourceWithRawTransaction(
            hre,
            normalizedChainId,
            resourceIdBytes32,
            resource,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const networkDirectory = await getNetworkDirectory(diamond, signer)

    console.log('📡 Sending setResource transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await networkDirectory.setResource(
            normalizedChainId,
            resourceIdBytes32,
            resource
        )
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

    if (
        typeof args.chainId !== 'bigint' ||
        typeof args.resourceId !== 'string' ||
        typeof args.resource !== 'string'
    ) {
        throw new Error('Invalid ResourceSet event args format')
    }

    const {
        chainId: evChainId,
        resourceId: evResourceId,
        resource: evResource,
    } = args

    if (evChainId !== normalizedChainId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Resource set successfully:`)
    console.log(`   Chain ID: ${evChainId}`)
    console.log(`   Resource ID: ${evResourceId}`)
    console.log(`   Resource: ${evResource}`)

    return {
        chainId: evChainId,
        resourceId: evResourceId,
        resource: evResource,
    }
}

/**
 * Set resource using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function setResourceWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    chainId: bigint,
    resourceIdBytes32: string,
    resource: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<ResourceSetResult> {
    const { NetworkDirectoryFacet__factory } =
        await import('../../../typechain-types')

    const contractInterface = NetworkDirectoryFacet__factory.createInterface()

    // Encode the setResource function call
    const functionData = contractInterface.encodeFunctionData('setResource', [
        chainId,
        resourceIdBytes32,
        resource,
    ])

    console.log('📡 Sending setResource raw transaction...')

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
            gasLimit: 200000n, // Reasonable gas limit for setResource
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
            `Failed to submit setResource raw transaction: ${
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

    // Parse ResourceSet event from the receipt
    const resourceSetEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!resourceSetEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = resourceSetEvent.args

    if (
        typeof args.chainId !== 'bigint' ||
        typeof args.resourceId !== 'string' ||
        typeof args.resource !== 'string'
    ) {
        throw new Error('Invalid ResourceSet event args format')
    }

    const {
        chainId: evChainId,
        resourceId: evResourceId,
        resource: evResource,
    } = args

    if (evChainId !== chainId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Resource set successfully:`)
    console.log(`   Chain ID: ${evChainId}`)
    console.log(`   Resource ID: ${evResourceId}`)
    console.log(`   Resource: ${evResource}`)

    return {
        chainId: evChainId,
        resourceId: evResourceId,
        resource: evResource,
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
