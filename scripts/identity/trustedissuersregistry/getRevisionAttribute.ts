import { Signer } from 'ethers'
import { getTrustedIssuersRegistry } from '../../utils/getTrustedIssuersRegistry'

export async function getRevisionAttribute(
    diamond: string,
    signer: Signer,
    did: string, // Changed parameter name to match new signature
    attributeId: string, // Updated parameter name and type to match new signature
    revisionId: string // Added missing parameter for revisionId
): Promise<{
    did: string // Updated return structure to match Attribute struct
    attributeId: string
    attribData: string
    tao: string
    rootTao: string
    issuerType: bigint // Assuming IssuerType is a numeric enum or similar
}> {
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    const result = await trustedIssuersRegistry.getRevisionAttribute(
        did,
        attributeId,
        revisionId // Updated function call to include revisionId parameter
    )

    return {
        did: result.did,
        attributeId: result.attributeId,
        attribData: result.attribData,
        tao: result.tao,
        rootTao: result.rootTao,
        issuerType: result.issuerType,
    }
}
