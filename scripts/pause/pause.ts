import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getPause } from '../utils/getPause'
import { getEvent } from '../utils/getEvent'

/**
 * Pause using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function pause(
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    account: string
}> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for pausing...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await pauseWithRawTransaction(diamond, signatureProvider)
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const pause = await getPause(diamond, signer)

    console.log('📡 Sending pause transaction...')
    const tx = await pause.pause()

    console.log('⏳ Waiting for transaction to be mined...')
    const pauseEvent = await getEvent('Paused', tx, pause)

    const { account: account } = pauseEvent.args

    return {
        account,
    }
}

/**
 * Pause using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function pauseWithRawTransaction(
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    account: string
}> {
    // Import ISBEPause interface for encoding function data
    const { ISBEPauseFacet__factory } = await import('../../typechain-types')

    // Create interface for encoding function data
    const pauseInterface = ISBEPauseFacet__factory.createInterface()

    // Encode the pause function call
    const functionData = pauseInterface.encodeFunctionData('pause', [])

    console.log('📡 Sending pause raw transaction...')

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 200000n, // Reasonable gas limit for pause
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit pause raw transaction: ${error instanceof Error ? error.message : String(error)}`
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

    // Parse Paused event from the receipt
    const pausedEvent = receipt.logs
        .map((log) => {
            try {
                return pauseInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === 'Paused')

    if (!pausedEvent) {
        throw new Error('Paused event not found in transaction receipt')
    }

    const { account } = pausedEvent.args

    return {
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function pauseLegacy(
    diamond: string,
    signer: Signer
): Promise<{
    account: string
}> {
    console.warn(
        '⚠️  Using legacy pause - consider switching to signature provider version'
    )

    const pause = await getPause(diamond, signer)
    const tx = await pause.pause()
    const pauseEvent = await getEvent('Paused', tx, pause)

    const { account: account } = pauseEvent.args

    return {
        account,
    }
}
