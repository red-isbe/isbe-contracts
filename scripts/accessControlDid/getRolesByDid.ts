import { Provider } from 'ethers'
import { getAccessControlDid } from './utils'

export async function getRolesByDid(
    did: string,
    page: number,
    pageSize: number,
    diamond: string,
    provider: Provider
) {
    const contract = await getAccessControlDid(diamond, provider)

    console.log('\n🔍 Getting Roles by DID...\n')
    console.log(`  DID:       ${did}`)
    console.log(`  Page:      ${page}`)
    console.log(`  Page Size: ${pageSize}`)
    console.log(`  Diamond:   ${diamond}`)
    console.log('')

    const roles = await contract.getRolesByDid(did, page, pageSize)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                   ROLES BY DID                            ')
    console.log('═══════════════════════════════════════════════════════════')

    console.log('\n📋 Roles:')
    if (roles.length === 0) {
        console.log('   (none)')
    } else {
        roles.forEach((role: string, index: number) => {
            const globalIndex = page * pageSize + index
            console.log(`   [${globalIndex}] ${role}`)
        })
    }

    console.log('')

    return { did, roles: roles.map((r: string) => r) }
}
