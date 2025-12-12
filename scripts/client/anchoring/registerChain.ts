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
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { getEvent } from '../../../scripts/utils/getEvent'
import { decodeError } from '../../../scripts/utils/translateCustomError'
import { ISignatureProvider } from '../../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'AnchoringCoreFacet'
const EVENT_NAME = 'ChainRegistered'

export interface ChainRegisteredResult {
    chainId: bigint
    registrar: string
}

export async function registerChain(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    signatureProvider: ISignatureProvider
): Promise<ChainRegisteredResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for chain registration...`
    )

    const chainIdNum = Number(chainid)

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await registerChainWithRawTransaction(
            hre,
            chainIdNum,
            governancediamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    console.log('📡 Sending registerChain transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await anchoringCoreFacet.registerChain(chainIdNum)
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        if (error?.data) {
            console.log(
                'Transaction SEND failed: \x1b[0;31m' +
                    ((await decodeError(hre, CONTRACT_NAME, error.data)) +
                        '\x1b[0m')
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
        anchoringCoreFacet
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (
        typeof args.chainId !== 'bigint' ||
        typeof args.registrar !== 'string'
    ) {
        throw new Error('Invalid ChainRegistered event args format')
    }

    const { chainId: evChainId, registrar: evRegistrar } = args

    if (evChainId !== BigInt(chainIdNum)) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    return {
        chainId: evChainId,
        registrar: evRegistrar,
    }
}

/**
 * Register chain using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function registerChainWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    chainIdNum: number,
    governancediamond: string,
    signatureProvider: ISignatureProvider
): Promise<ChainRegisteredResult> {
    const { IAnchoringCore__factory } = await import('../../../typechain-types')

    const contractInterface = IAnchoringCore__factory.createInterface()

    // Encode the registerChain function call
    const functionData = contractInterface.encodeFunctionData('registerChain', [
        chainIdNum,
    ])

    console.log('📡 Sending registerChain raw transaction...')

    let txResponse
    try {
        // FIRST simulate tx to catch errors early and avoid gas costs
        await hre.ethers.provider.call({
            to: governancediamond,
            from: await signatureProvider.getAddress(),
            data: functionData,
        })

        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: governancediamond,
            data: functionData,
            gasLimit: 400000n, // Reasonable gas limit for registerChain
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        if (error?.data) {
            console.log(
                '   ❌ Error: \x1b[0;31m' +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    '\x1b[0m'
            )
        }
        throw new Error(
            `Failed to submit registerChain raw transaction: ${
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

    // Parse ChainRegistered event from the receipt
    const chainRegisteredEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!chainRegisteredEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = chainRegisteredEvent.args

    if (
        typeof args.chainId !== 'bigint' ||
        typeof args.registrar !== 'string'
    ) {
        throw new Error('Invalid ChainRegistered event args format')
    }

    const { chainId: evChainId, registrar: evRegistrar } = args

    if (evChainId !== BigInt(chainIdNum)) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    return {
        chainId: evChainId,
        registrar: evRegistrar,
    }
}
