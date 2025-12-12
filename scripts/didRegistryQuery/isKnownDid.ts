import { Provider } from 'ethers'
import { getDidRegistryQuery } from '../did/utils'

export async function isKnownDid(
    account: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidRegistryQuery(diamond, provider)

    console.log('\n🔍 Checking known DID...\n')
    console.log(`  Account: ${account}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const isKnown = await contract.isKnownDid(account)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                      IS KNOWN DID                         ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  Result: ${isKnown}`)
    console.log('═══════════════════════════════════════════════════════════\n')

    return { account, isKnown }
}
