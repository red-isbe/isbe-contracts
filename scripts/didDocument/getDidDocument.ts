import { Provider } from 'ethers'
import { getDidDocumentFacet, EllipticTypeNames } from './utils'

interface VerificationRelationship {
    name: string
    vMethodId: string
    notBefore: bigint
    notAfter: bigint
    indexDid: bigint
}

export async function getDidDocument(
    did: string,
    diamond: string,
    provider: Provider
) {
    const contract = getDidDocumentFacet(diamond, provider)

    console.log('\n🔍 Getting DID Document...\n')
    console.log(`  DID:     ${did}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const result = await contract.getDidDocument(did)

    const [
        baseDocument,
        alsoKnownAs,
        controllers,
        vMethodIds,
        vMethods,
        vRelationships,
    ] = result

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                     DID DOCUMENT                          ')
    console.log('═══════════════════════════════════════════════════════════')

    console.log('\n📄 Base Document:')
    console.log(`   ${baseDocument || '(empty)'}`)

    console.log('\n🔗 Also Known As:')
    console.log(`   ${alsoKnownAs || '(empty)'}`)

    console.log('\n👥 Controllers:')
    if (controllers.length === 0) {
        console.log('   (none)')
    } else {
        controllers.forEach((controller: string, index: number) => {
            console.log(`   [${index}] ${controller}`)
        })
    }

    console.log('\n🔐 Verification Methods:')
    if (vMethodIds.length === 0) {
        console.log('   (none)')
    } else {
        vMethodIds.forEach((methodId: string, index: number) => {
            const method = vMethods[index]
            console.log(`   [${index}] Method ID: ${methodId}`)
            console.log(`       Public Key:    ${method.publicKey}`)
            console.log(
                `       Elliptic Type: ${EllipticTypeNames[Number(method.ellipticType)] || method.ellipticType}`
            )
            console.log(`       Revoked:       ${method.revoked}`)
        })
    }

    console.log('\n📋 Verification Relationships:')
    if (vRelationships.length === 0) {
        console.log('   (none)')
    } else {
        vRelationships.forEach(
            (rel: VerificationRelationship, index: number) => {
                console.log(`   [${index}] Name: ${rel.name}`)
                console.log(`       V-Method ID: ${rel.vMethodId}`)
                console.log(
                    `       Not Before:  ${rel.notBefore.toString()} (${new Date(Number(rel.notBefore) * 1000).toISOString()})`
                )
                console.log(
                    `       Not After:   ${rel.notAfter.toString()} (${new Date(Number(rel.notAfter) * 1000).toISOString()})`
                )
                console.log(`       Index DID:   ${rel.indexDid.toString()}`)
            }
        )
    }

    console.log('\n═══════════════════════════════════════════════════════════')

    return result
}
