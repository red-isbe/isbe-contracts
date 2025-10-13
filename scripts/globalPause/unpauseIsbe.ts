import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'

/**
 * Unpause ISBE using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function unpauseIsbe(
    proxyAddress: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    unpausedProxyAddress: string
    account: string
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for ISBE unpausing...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await unpauseIsbeWithRawTransaction(
            proxyAddress,
            factory,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const globalIsbePause = await getIsbeFactory(factory, signer)

    console.log('📡 Sending unpauseIsbe transaction...')
    const tx = await globalIsbePause.unpauseIsbe(proxyAddress)

    console.log('⏳ Waiting for transaction to be mined...')
    const unpauseEvent = await getEvent('IsbeUnpaused', tx, globalIsbePause)

    const { proxyAddress: unpausedProxyAddress, account: account } =
        unpauseEvent.args

    return {
        unpausedProxyAddress,
        account,
    }
}

/**
 * Unpause ISBE using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function unpauseIsbeWithRawTransaction(
    proxyAddress: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    unpausedProxyAddress: string
    account: string
}> {
    // Import GlobalIsbePause interface for encoding function data
    const { GlobalIsbePauseFacet__factory } = await import(
        '../../typechain-types'
    )

    // Create interface for encoding function data
    const globalIsbePauseInterface =
        GlobalIsbePauseFacet__factory.createInterface()

    // Encode the unpauseIsbe function call
    const functionData = globalIsbePauseInterface.encodeFunctionData(
        'unpauseIsbe',
        [proxyAddress]
    )

    console.log('📡 Sending unpauseIsbe raw transaction...')

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: factory,
            data: functionData,
            gasLimit: 300000n, // Reasonable gas limit for unpauseIsbe
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit unpauseIsbe raw transaction: ${error instanceof Error ? error.message : String(error)}`
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

    // Parse IsbeUnpaused event from the receipt using the same approach as secp256k1
    let isbeUnpausedEvent = null
    const parseErrors: string[] = []

    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i]
        try {
            const parsed = globalIsbePauseInterface.parseLog(log)
            if (parsed && parsed.name === 'IsbeUnpaused') {
                isbeUnpausedEvent = parsed
                break
            }
        } catch (error) {
            // Collect parse errors but don't fail immediately
            parseErrors.push(
                `Log ${i}: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    if (!isbeUnpausedEvent) {
        console.log(`   📄 Transaction Status: Success`)
        console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`)
        console.log(`   📊 Total Logs: ${receipt.logs.length}`)
        if (parseErrors.length > 0) {
            console.log(`   ⚠️  Parse errors: ${parseErrors.join('; ')}`)
        }

        // Enhanced error message with more debugging info
        const errorMessage =
            parseErrors.length > 0
                ? `IsbeUnpaused event not found in transaction receipt. Parse errors encountered: ${parseErrors.join('; ')}`
                : `IsbeUnpaused event not found in transaction receipt. No matching events found in ${receipt.logs.length} logs.`

        throw new Error(errorMessage)
    }

    const { proxyAddress: unpausedProxyAddress, account } =
        isbeUnpausedEvent.args

    return {
        unpausedProxyAddress,
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function unpauseIsbeLegacy(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    unpausedProxyAddress: string
    account: string
}> {
    console.warn(
        '⚠️  Using legacy unpauseIsbe - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    const globalIsbePause = await getIsbeFactory(factory, signer)
    const tx = await globalIsbePause.unpauseIsbe(proxyAddress)
    const unpauseEvent = await getEvent('IsbeUnpaused', tx, globalIsbePause)

    const { proxyAddress: unpausedProxyAddress, account: account } =
        unpauseEvent.args

    return {
        unpausedProxyAddress,
        account,
    }
}
