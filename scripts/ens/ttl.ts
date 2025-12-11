import { Provider } from 'ethers'
import { getEnsRegistry } from './utils'

export async function ttl(node: string, diamond: string, provider: Provider) {
    const contract = getEnsRegistry(diamond, provider)

    console.log('📋 Getting ENS node TTL')
    console.log(`   Node: ${node}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.ttl(node)
    console.log(`\n📊 TTL: ${result} seconds`)
    return result
}
