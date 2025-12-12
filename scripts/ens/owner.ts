import { Provider } from 'ethers'
import { getEnsRegistry } from './utils'

export async function owner(node: string, diamond: string, provider: Provider) {
    const contract = await getEnsRegistry(diamond, provider)

    console.log('📋 Getting ENS node owner')
    console.log(`   Node: ${node}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.owner(node)
    console.log(`\n📊 Owner: ${result}`)
    return result
}
