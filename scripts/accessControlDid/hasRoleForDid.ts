import { Provider } from 'ethers'
import { getAccessControlDid } from './utils'

export async function hasRoleForDid(
    role: string,
    did: string,
    diamond: string,
    provider: Provider
) {
    const contract = getAccessControlDid(diamond, provider)

    console.log('\n🔍 Checking Role for DID...\n')
    console.log(`  Role:    ${role}`)
    console.log(`  DID:     ${did}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const hasRole = await contract.hasRoleForDid(role, did)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                  HAS ROLE FOR DID                         ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`\n  Result: ${hasRole ? '✅ YES' : '❌ NO'}`)
    console.log('')

    return { role, did, hasRole }
}
