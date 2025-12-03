import { Signer } from 'ethers'
import { getTrustedIssuersRegistry } from '../../utils/getTrustedIssuersRegistry'

export async function getIssuer(
    diamond: string,
    signer: Signer,
    did: string // Assuming we need to pass the DID parameter
): Promise<{
    noAttributesAccepted: boolean
    totalAttributes: bigint
}> {
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    const [noAttributesAccepted, totalAttributes] =
        await trustedIssuersRegistry.getIssuer(did)

    return {
        noAttributesAccepted,
        totalAttributes,
    }
}
