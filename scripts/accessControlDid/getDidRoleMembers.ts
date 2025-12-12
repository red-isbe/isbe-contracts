import { Provider } from 'ethers'
import { getAccessControlDid } from './utils'

export async function getDidRoleMembers(
    role: string,
    page: number,
    pageSize: number,
    diamond: string,
    provider: Provider
) {
    const contract = await getAccessControlDid(diamond, provider)

    console.log('\n🔍 Getting DID Role Members...\n')
    console.log(`  Role:      ${role}`)
    console.log(`  Page:      ${page}`)
    console.log(`  Page Size: ${pageSize}`)
    console.log(`  Diamond:   ${diamond}`)
    console.log('')

    const dids = await contract.getDidRoleMembers(role, page, pageSize)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                  DID ROLE MEMBERS                         ')
    console.log('═══════════════════════════════════════════════════════════')

    console.log('\n📋 DIDs with this role:')
    if (dids.length === 0) {
        console.log('   (none)')
    } else {
        dids.forEach((did: string, index: number) => {
            const globalIndex = page * pageSize + index
            console.log(`   [${globalIndex}] ${did}`)
        })
    }

    console.log('')

    return { role, dids: dids.map((d: string) => d) }
}
