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

export async function addVerificationMethod(
    did: string,
    vMethodId: string,
    publicKey: string,
    ellipticType: number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    console.log('\n🔐 Adding Verification Method...\n')
    console.log(`  DID:          ${did}`)
    console.log(`  V-Method ID:  ${vMethodId}`)
    console.log(`  Public Key:   ${publicKey.substring(0, 30)}...`)
    console.log(
        `  EllipticType: ${EllipticTypeNames[ellipticType] || ellipticType}`
    )
    console.log(`  Diamond:      ${diamond}`)
    console.log(`  Curve:        ${signatureProvider.getCurveType()}`)
    console.log('')

    const DidVerificationMethodFacet__factory =
        await loadDidVerificationMethodFactory()

    await executeDidWrite(
        DidVerificationMethodFacet__factory,
        diamond,
        signatureProvider,
        'addVerificationMethod',
        [did, vMethodId, publicKey, ellipticType],
        800000n
    )

    console.log('\n✅ Verification method added')
    return { did, vMethodId }
}
