import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidWrite } from '../did/utils'

async function loadDidVerificationMethodFactory() {
    const { DidVerificationMethodFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationMethodFacet__factory
}

const EllipticTypeNames: Record<number, string> = {
    0: 'NONE',
    1: 'SECP_256_K1',
    2: 'SECP_256_R1',
}

export async function rollVerificationMethod(
    did: string,
    vMethodId: string,
    publicKey: string,
    ellipticType: number,
    notBefore: bigint | number,
    notAfter: bigint | number,
    oldVMethodId: string,
    duration: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🔄 Rolling Verification Method...\n')
    console.log(`  DID:           ${did}`)
    console.log(`  New V-Method:  ${vMethodId}`)
    console.log(`  Old V-Method:  ${oldVMethodId}`)
    console.log(`  Public Key:    ${publicKey.substring(0, 30)}...`)
    console.log(
        `  EllipticType:  ${EllipticTypeNames[ellipticType] || ellipticType}`
    )
    console.log(`  Not Before:    ${notBefore}`)
    console.log(`  Not After:     ${notAfter}`)
    console.log(`  Duration:      ${duration}`)
    console.log(`  Diamond:       ${diamond}`)
    console.log(`  Curve:         ${signatureProvider.getCurveType()}`)
    console.log('')

    const args = {
        did,
        vMethodId,
        publicKey,
        ellipticType,
        notBefore: BigInt(notBefore),
        notAfter: BigInt(notAfter),
        oldVMethodId,
        duration: BigInt(duration),
    }

    const DidVerificationMethodFacet__factory =
        await loadDidVerificationMethodFactory()

    await executeDidWrite(
        DidVerificationMethodFacet__factory,
        diamond,
        signatureProvider,
        'rollVerificationMethod',
        [args],
        1200000n
    )

    console.log('\n✅ Verification method rolled')
    return { did, vMethodId, oldVMethodId }
}
