import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidDocumentWrite, EllipticTypeNames } from './utils'

export async function insertFirstDidDocument(
    did: string,
    baseDocument: string,
    vMethodId: string,
    proof: string,
    publicKey: string,
    ellipticType: number,
    notBefore: bigint | number,
    notAfter: bigint | number,
    alsoKnownAs: string,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    const notBeforeDate = new Date(Number(notBefore) * 1000).toISOString()
    const notAfterDate = new Date(Number(notAfter) * 1000).toISOString()

    console.log('\n📝 Inserting First DID Document...\n')
    console.log(`  DID:           ${did}`)
    console.log(
        `  Base Doc:      ${baseDocument.substring(0, 40)}${baseDocument.length > 40 ? '...' : ''}`
    )
    console.log(`  V-Method ID:   ${vMethodId}`)
    console.log(`  Proof:         ${proof.substring(0, 20)}...`)
    console.log(`  Public Key:    ${publicKey.substring(0, 20)}...`)
    console.log(
        `  Elliptic Type: ${EllipticTypeNames[ellipticType] || ellipticType}`
    )
    console.log(`  Not Before:    ${notBefore} (${notBeforeDate})`)
    console.log(`  Not After:     ${notAfter} (${notAfterDate})`)
    console.log(`  Also Known As: ${alsoKnownAs}`)
    console.log(`  Diamond:       ${diamond}`)
    console.log(`  Curve:         ${signatureProvider.getCurveType()}`)
    console.log('')

    await executeDidDocumentWrite(
        diamond,
        signatureProvider,
        'insertFirstDidDocument',
        [
            did,
            baseDocument,
            vMethodId,
            proof,
            publicKey,
            ellipticType,
            BigInt(notBefore),
            BigInt(notAfter),
            alsoKnownAs,
        ],
        500000n
    )

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('            FIRST DID DOCUMENT INSERTED                     ')
    console.log('═══════════════════════════════════════════════════════════')

    return { did, vMethodId, alsoKnownAs }
}
