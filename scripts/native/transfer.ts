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
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../utils/validation'
import { parseEther, formatEther, Provider } from 'ethers'

interface NativeTransferResult {
    from: string
    to: string
    amount: string
    transactionHash: string
    gasUsed?: string
}

interface EnhancedError extends Error {
    originalError: unknown
    context?: {
        operation: string
        from: string
        to: string
        amount: string
    }
    transactionHash?: string
}

/**
 * Transfer native tokens (ETH/ISBE) using signature provider pattern
 * Supports both secp256k1 and secp256r1 curves
 *
 * @param to - The recipient address
 * @param amount - The amount to transfer in ether units (e.g., "1.5" for 1.5 ETH/ISBE)
 * @param signatureProvider - The signature provider for transaction signing
 * @param provider - The ethers provider
 * @returns Transfer result with transaction details
 */
export async function transferNative(
    to: string,
    amount: string,
    signatureProvider: ISignatureProvider,
    provider: Provider
): Promise<NativeTransferResult> {
    // Validate inputs
    if (!isValidBytesAndLength(to, 20)) {
        throw new Error('Invalid recipient address format: ' + to)
    }

    const parsedAmount = parseEther(amount)
    if (parsedAmount <= 0n) {
        throw new Error('Amount must be greater than 0')
    }

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for native transfer...`
    )

    const senderAddress = await signatureProvider.getAddress()

    // Check balance before transfer
    const balance = await provider.getBalance(senderAddress)
    console.log(`   💰 Current balance: ${formatEther(balance)} native tokens`)

    if (balance < parsedAmount) {
        throw new Error(
            `Insufficient balance. Have: ${formatEther(balance)}, Need: ${amount}`
        )
    }

    console.log('📡 Sending native transfer transaction...')
    console.log(`   From: ${senderAddress}`)
    console.log(`   To: ${to}`)
    console.log(`   Amount: ${amount} native tokens`)

    let tx
    try {
        // Use sendTransaction from signature provider (works for both curves)
        tx = await signatureProvider.sendTransaction({
            to,
            value: parsedAmount,
            data: '0x', // Empty data for simple transfer
        })
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        console.log('❌ Transaction failed to submit')
        const enhancedError: EnhancedError = new Error(
            `Failed to submit native transfer: ${error instanceof Error ? error.message : String(error)}`
        ) as EnhancedError
        enhancedError.originalError = error
        enhancedError.context = {
            operation: 'native:transfer',
            from: senderAddress,
            to,
            amount,
        }
        throw enhancedError
    }

    console.log('⏳ Waiting for transaction to be mined...')
    const receipt = await tx.wait()

    if (receipt && receipt.status === 1) {
        console.log('✅ Native transfer successful!')
        return {
            from: senderAddress,
            to,
            amount,
            transactionHash: tx.hash,
            gasUsed: receipt.gasUsed?.toString(),
        }
    }

    throw new Error(`Native transfer failed with status: ${receipt?.status}`)
}

/**
 * Get native token balance for an account
 *
 * @param account - The account address to check
 * @param provider - The ethers provider
 * @returns Balance in ether units (formatted string)
 */
export async function getNativeBalance(
    account: string,
    provider: Provider
): Promise<string> {
    if (!isValidBytesAndLength(account, 20)) {
        throw new Error('Invalid account address format: ' + account)
    }

    const balance = await provider.getBalance(account)
    return formatEther(balance)
}

/**
 * Get native token balances for multiple accounts
 *
 * @param accounts - Array of account addresses
 * @param provider - The ethers provider
 * @returns Array of balances with account info
 */
export async function getNativeBalances(
    accounts: string[],
    provider: Provider
): Promise<Array<{ account: string; balance: string }>> {
    const results = await Promise.all(
        accounts.map(async (account) => {
            try {
                const balance = await getNativeBalance(account, provider)
                return { account, balance }
            } catch (error) {
                return {
                    account,
                    balance:
                        'Error: ' +
                        (error instanceof Error
                            ? error.message
                            : String(error)),
                }
            }
        })
    )
    return results
}

/**
 * Get network information
 *
 * @param provider - The ethers provider
 * @returns Network info
 */
export async function getNetworkInfo(provider: Provider): Promise<{
    chainId: bigint
    name: string
    blockNumber: number
}> {
    const [network, blockNumber] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber(),
    ])

    return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
    }
}
