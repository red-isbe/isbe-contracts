import { Provider } from 'ethers'
import { getAccessControlDid } from './utils'

export async function getRoleMembersCountForDids(
    role: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getAccessControlDid(diamond, provider)

    console.log('\n🔍 Getting Role Members Count for DIDs...\n')
    console.log(`  Role:    ${role}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const count = await contract.getRoleMembersCountForDids(role)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('              ROLE MEMBERS COUNT (DIDs)                    ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`\n  Total DIDs with role: ${count.toString()}`)
    console.log('')

    return { role, count: count.toString() }
}
