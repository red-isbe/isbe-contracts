import { Provider } from 'ethers'
import { getAccessControlDid } from './utils'

export async function getRolesByDidLength(
    did: string,
    diamond: string,
    provider: Provider
) {
    const contract = getAccessControlDid(diamond, provider)

    console.log('\n🔍 Getting Roles Count for DID...\n')
    console.log(`  DID:     ${did}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const count = await contract.getRolesByDidLength(did)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                ROLES COUNT FOR DID                        ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`\n  Total Roles: ${count.toString()}`)
    console.log('')

    return { did, count: count.toString() }
}
