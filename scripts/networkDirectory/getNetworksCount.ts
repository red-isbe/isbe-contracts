import { Provider } from 'ethers'
import { getNetworkDirectory } from './utils'

export async function getNetworksCount(diamond: string, provider: Provider) {
    const contract = getNetworkDirectory(diamond, provider)

    console.log('📋 Getting networks count')
    console.log(`   Diamond: ${diamond}`)

    const count = await contract.getNetworksCount()

    console.log(`\n📊 Total Networks: ${count}`)
    return count
}
