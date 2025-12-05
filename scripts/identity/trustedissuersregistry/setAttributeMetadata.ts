import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { getTrustedIssuersRegistry } from '../../utils/getTrustedIssuersRegistry'
import { getEvent } from '../../utils/getEvent'

/**
 * TrustedIssuersRegistry using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function setAttributeMetadata(
    did: string,
    issuerType: number,
    revisionId: string,
    taoDid: string,
    attributeIdTao: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    did: string
    issuerType: number
    revisionId: string
    taoDid: string
    attributeIdTao: string
    newRevisionId: string
    rootTaoDid: string
}> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for setAttributeMetadata...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await setAttributeMetadataWithRawTransaction(
            did,
            issuerType,
            revisionId,
            taoDid,
            attributeIdTao,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    console.log('📡 Sending setAttributeMetadata transaction...')
    const tx = await trustedIssuersRegistry.setAttributeMetadata(
        did,
        issuerType,
        revisionId,
        taoDid,
        attributeIdTao
    )

    console.log('⏳ Waiting for transaction to be mined...')
    const attributeMetadataSetEvent = await getEvent(
        'AttributeMetadataSet',
        tx,
        trustedIssuersRegistry
    )
    return {
        did: attributeMetadataSetEvent.args.did,
        issuerType: attributeMetadataSetEvent.args.issuerType,
        revisionId: attributeMetadataSetEvent.args.revisionId,
        taoDid: attributeMetadataSetEvent.args.taoDid,
        attributeIdTao: attributeMetadataSetEvent.args.attributeIdTao,
        newRevisionId: attributeMetadataSetEvent.args.newRevisionId,
        rootTaoDid: attributeMetadataSetEvent.args.rootTaoDid,
    }
}

/**
 * Pause using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function setAttributeMetadataWithRawTransaction(
    did: string,
    issuerType: number,
    revisionId: string,
    taoDid: string,
    attributeIdTao: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    did: string
    issuerType: number
    revisionId: string
    taoDid: string
    attributeIdTao: string
    newRevisionId: string
    rootTaoDid: string
}> {
    const { TrustedIssuersRegistryFacet__factory } =
        await import('../../../typechain-types')
    // Create interface for encoding function data
    const trustedIssuersRegistryInterface =
        TrustedIssuersRegistryFacet__factory.createInterface()

    // Encode the pause function call
    const functionData = trustedIssuersRegistryInterface.encodeFunctionData(
        'setAttributeMetadata',
        [did, issuerType, revisionId, taoDid, attributeIdTao]
    )

    console.log('📡 Sending setAttributeMetadata raw transaction...')

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
    const attributeMetadataSetEvent =
        receipt.logs
            .map((log) => {
                try {
                    return trustedIssuersRegistryInterface.parseLog(log)
                } catch {
                    return null
                }
            })
            .find((log) => log && log.name === 'AttributeMetadataSet') ?? null

    if (!attributeMetadataSetEvent) {
        throw new Error(
            'AttributeMetadataSet event not found in transaction receipt'
        )
    }

    return {
        did: attributeMetadataSetEvent.args.did,
        issuerType: attributeMetadataSetEvent.args.issuerType,
        revisionId: attributeMetadataSetEvent.args.revisionId,
        taoDid: attributeMetadataSetEvent.args.taoDid,
        attributeIdTao: attributeMetadataSetEvent.args.attributeIdTao,
        newRevisionId: attributeMetadataSetEvent.args.newRevisionId,
        rootTaoDid: attributeMetadataSetEvent.args.rootTaoDid,
    }
}
