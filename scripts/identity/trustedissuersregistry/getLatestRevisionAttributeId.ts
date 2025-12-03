import { Signer } from 'ethers'
import { getTrustedIssuersRegistry } from '../../utils/getTrustedIssuersRegistry'

export async function getLatestRevisionAttributeId(
    diamond: string,
    signer: Signer,
    did: string, // Changed parameter name to match new signature
    attributeId: string // Updated parameter name and type to match new signature
): Promise<{
    latestRevisionAttributeId: string // Updated return type to match new signature
}> {
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    const latestRevisionAttributeId =
        await trustedIssuersRegistry.getLatestRevisionAttributeId(
            did,
            attributeId
        ) // Updated function call

    return {
        latestRevisionAttributeId,
    }
}
