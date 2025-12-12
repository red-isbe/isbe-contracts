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
import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getPause } from '../utils/getPause'
import { getEvent } from '../utils/getEvent'

/**
 * Unpause using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function unpause(
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    account: string
}> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for unpausing...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await unpauseWithRawTransaction(diamond, signatureProvider)
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const pause = await getPause(diamond, signer)

    console.log('📡 Sending unpause transaction...')
    const tx = await pause.unpause()

    console.log('⏳ Waiting for transaction to be mined...')
    const unpauseEvent = await getEvent('Unpaused', tx, pause)

    const { account: account } = unpauseEvent.args

    return {
        account,
    }
}

/**
 * Unpause using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function unpauseWithRawTransaction(
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    account: string
}> {
    // Import ISBEPause interface for encoding function data
    const { ISBEPauseFacet__factory } = await import('../../typechain-types')

    // Create interface for encoding function data
    const pauseInterface = ISBEPauseFacet__factory.createInterface()

    // Encode the unpause function call
    const functionData = pauseInterface.encodeFunctionData('unpause', [])

    console.log('📡 Sending unpause raw transaction...')

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 200000n, // Reasonable gas limit for unpause
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit unpause raw transaction: ${error instanceof Error ? error.message : String(error)}`
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

    // Parse Unpaused event from the receipt
    const unpausedEvent = receipt.logs
        .map((log) => {
            try {
                return pauseInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === 'Unpaused')

    if (!unpausedEvent) {
        throw new Error('Unpaused event not found in transaction receipt')
    }

    const { account } = unpausedEvent.args

    return {
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function unpauseLegacy(
    diamond: string,
    signer: Signer
): Promise<{
    account: string
}> {
    console.warn(
        '⚠️  Using legacy unpause - consider switching to signature provider version'
    )

    const pause = await getPause(diamond, signer)
    const tx = await pause.unpause()
    const unpauseEvent = await getEvent('Unpaused', tx, pause)

    const { account: account } = unpauseEvent.args

    return {
        account,
    }
}
