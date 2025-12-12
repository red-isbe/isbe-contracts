import { Provider } from 'ethers'
import { getDidRegistryQuery } from '../did/utils'

export async function didOf(
    account: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidRegistryQuery(diamond, provider)

    console.log('\n🔍 Resolving DID of address...\n')
    console.log(`  Account: ${account}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const did = await contract.didOf(account)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                        DID OF                             ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  DID: ${did}`)
    console.log('═══════════════════════════════════════════════════════════\n')

    return { account, did }
}
