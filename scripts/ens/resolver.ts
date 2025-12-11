import { Provider } from 'ethers'
import { getEnsRegistry } from './utils'

export async function resolver(
    node: string,
    diamond: string,
    provider: Provider
) {
    const contract = getEnsRegistry(diamond, provider)

    console.log('📋 Getting ENS node resolver')
    console.log(`   Node: ${node}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.resolver(node)
    console.log(`\n📊 Resolver: ${result}`)
    return result
}
