import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidWrite } from '../did/utils'

async function loadDidVerificationMethodFactory() {
    const { DidVerificationMethodFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationMethodFacet__factory
}

export async function revokeVerificationMethod(
    did: string,
    vMethodId: string,
    notAfter: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🚫 Revoking Verification Method...\n')
    console.log(`  DID:         ${did}`)
    console.log(`  V-Method ID: ${vMethodId}`)
    console.log(`  Not After:   ${notAfter}`)
    console.log(`  Diamond:     ${diamond}`)
    console.log(`  Curve:       ${signatureProvider.getCurveType()}`)
    console.log('')

    const DidVerificationMethodFacet__factory =
        await loadDidVerificationMethodFactory()

    await executeDidWrite(
        DidVerificationMethodFacet__factory,
        diamond,
        signatureProvider,
        'revokeVerificationMethod',
        [did, vMethodId, BigInt(notAfter)],
        800000n
    )

    console.log('\n✅ Verification method revoked')
    return { did, vMethodId, notAfter }
}
