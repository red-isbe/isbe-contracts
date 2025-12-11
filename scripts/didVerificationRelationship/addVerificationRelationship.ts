import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { executeDidWrite } from '../did/utils'

async function loadDidVerificationRelationshipFactory() {
    const { DidVerificationRelationshipFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationRelationshipFacet__factory
}

const VALID_NAMES = [
    'authentication',
    'assertionMethod',
    'keyAgreement',
    'capabilityInvocation',
    'capabilityDelegation',
]

export async function addVerificationRelationship(
    did: string,
    name: string,
    vMethodId: string,
    notBefore: bigint | number,
    notAfter: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
) {
    if (!VALID_NAMES.includes(name)) {
        throw new Error(
            `Invalid relationship name. Use: ${VALID_NAMES.join(' | ')}`
        )
    }

    console.log('\n🔗 Adding Verification Relationship...\n')
    console.log(`  DID:         ${did}`)
    console.log(`  Name:        ${name}`)
    console.log(`  V-Method ID: ${vMethodId}`)
    console.log(`  Not Before:  ${notBefore}`)
    console.log(`  Not After:   ${notAfter}`)
    console.log(`  Diamond:     ${diamond}`)
    console.log(`  Curve:       ${signatureProvider.getCurveType()}`)
    console.log('')

    const DidVerificationRelationshipFacet__factory =
        await loadDidVerificationRelationshipFactory()

    await executeDidWrite(
        DidVerificationRelationshipFacet__factory,
        diamond,
        signatureProvider,
        'addVerificationRelationship',
        [did, name, vMethodId, BigInt(notBefore), BigInt(notAfter)],
        900000n
    )

    console.log('\n✅ Verification relationship added')
    return { did, name, vMethodId, notBefore, notAfter }
}
