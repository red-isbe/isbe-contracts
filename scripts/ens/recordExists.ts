import { Provider } from 'ethers'
import { getEnsRegistry } from './utils'

export async function recordExists(
    node: string,
    diamond: string,
    provider: Provider
) {
    const contract = getEnsRegistry(diamond, provider)

    console.log('📋 Checking if ENS record exists')
    console.log(`   Node: ${node}`)
    console.log(`   Diamond: ${diamond}`)

    const exists = await contract.recordExists(node)
    console.log(`\n📊 Record Exists: ${exists ? '✅ YES' : '❌ NO'}`)
    return exists
}
