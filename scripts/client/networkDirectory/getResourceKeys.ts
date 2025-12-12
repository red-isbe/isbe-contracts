import { Provider } from 'ethers'
import { bytes32ToString, getNetworkDirectory } from './utils'

export async function getResourceKeys(
    chainId: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedChainId = BigInt(chainId)
    const contract = await getNetworkDirectory(diamond, provider)

    console.log(`📋 Getting resource keys for Chain ID: ${normalizedChainId}`)
    console.log(`   Diamond: ${diamond}`)

    const resourceKeys = await contract.getResourceKeys(normalizedChainId)

    console.log(`\n📊 Found ${resourceKeys.length} resource key(s):\n`)

    if (resourceKeys.length === 0) {
        console.log('   No resources for this network.')
        return resourceKeys
    }

    resourceKeys.forEach((key, index) => {
        console.log(`   [${index}] ${bytes32ToString(key)} (${key})`)
    })

    return resourceKeys
}
