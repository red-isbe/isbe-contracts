import { Provider } from 'ethers'
import { getEnsRegistry } from './utils'

export async function isApprovedForAll(
    owner: string,
    operator: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getEnsRegistry(diamond, provider)

    console.log(`📋 Checking operator approval`)
    console.log(`   Owner: ${owner}`)
    console.log(`   Operator: ${operator}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.isApprovedForAll(owner, operator)
    console.log(`\n📊 Is Approved For All: ${result ? '✅ YES' : '❌ NO'}`)
    return result
}
