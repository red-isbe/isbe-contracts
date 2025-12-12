/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
import { Provider } from 'ethers'
import { getDidDocumentFacet, EllipticTypeNames } from './utils'

interface VerificationRelationship {
    name: string
    vMethodId: string
    notBefore: bigint
    notAfter: bigint
    indexDid: bigint
}

export async function getDidDocumentByTimestamp(
    did: string,
    timestamp: number,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidDocumentFacet(diamond, provider)
    const timestampDate = new Date(timestamp * 1000).toISOString()

    console.log('\n🔍 Getting DID Document by Timestamp...\n')
    console.log(`  DID:       ${did}`)
    console.log(`  Timestamp: ${timestamp} (${timestampDate})`)
    console.log(`  Diamond:   ${diamond}`)
    console.log('')

    const result = await contract.getDidDocumentByTimestamp(did, timestamp)

    const [
        baseDocument,
        alsoKnownAs,
        controllers,
        vMethodIds,
        vMethods,
        vRelationships,
    ] = result

    console.log('═══════════════════════════════════════════════════════════')
    console.log('              DID DOCUMENT (HISTORICAL)                    ')
    console.log(`              At: ${timestampDate}                         `)
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

    console.log('\n🔐 Verification Methods (valid at timestamp):')
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

    console.log('\n📋 Verification Relationships (valid at timestamp):')
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
