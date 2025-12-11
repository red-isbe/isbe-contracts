import { Provider } from 'ethers'
import { getNetworkDirectory } from './utils'

export async function getResourceCount(
    chainId: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedChainId = BigInt(chainId)
    const contract = getNetworkDirectory(diamond, provider)

    console.log(`📋 Getting resource count for Chain ID: ${normalizedChainId}`)
    console.log(`   Diamond: ${diamond}`)

    const count = await contract.getResourceCount(normalizedChainId)

    console.log(`\n📊 Total Resources: ${count}`)
    return count
}
