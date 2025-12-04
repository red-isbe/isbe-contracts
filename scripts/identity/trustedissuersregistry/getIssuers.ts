import { Signer } from 'ethers'
import { getTrustedIssuersRegistry } from '../../utils/getTrustedIssuersRegistry'

export async function getIssuers(
    diamond: string,
    signer: Signer,
    page: bigint, // Changed parameter name to match new signature
    pageSize: bigint // Changed parameter name to match new signature
): Promise<{
    items: string[] // Updated return type to match new signature
    total: bigint
    howMany: bigint
    prev: bigint
    next: bigint
}> {
    const trustedIssuersRegistry = await getTrustedIssuersRegistry(
        diamond,
        signer
    )

    const [items, total, howMany, prev, next] =
        await trustedIssuersRegistry.getIssuers(page, pageSize) // Updated function call

    return {
        items,
        total,
        howMany,
        prev,
        next,
    }
}
