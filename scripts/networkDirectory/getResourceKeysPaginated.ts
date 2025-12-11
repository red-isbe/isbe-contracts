import { Provider } from 'ethers'
import { bytes32ToString, getNetworkDirectory } from './utils'

export async function getResourceKeysPaginated(
    chainId: bigint | number,
    pageSize: bigint | number,
    pageIndex: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedChainId = BigInt(chainId)
    const normalizedPageSize = BigInt(pageSize)
    const normalizedPageIndex = BigInt(pageIndex)

    const contract = getNetworkDirectory(diamond, provider)

    console.log('📋 Getting resource keys paginated')
    console.log(`   Chain ID: ${normalizedChainId}`)
    console.log(`   Page Size: ${normalizedPageSize}`)
    console.log(`   Page Index: ${normalizedPageIndex}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.getResourceKeysPaginated(
        normalizedChainId,
        normalizedPageSize,
        normalizedPageIndex
    )

    const [resourceIds, totalCount, howMany, prev, next] = result

    console.log(`\n📊 Pagination Info:`)
    console.log(`   Total Count: ${totalCount}`)
    console.log(`   Returned: ${howMany}`)
    console.log(`   Previous Page: ${prev}`)
    console.log(`   Next Page: ${next}`)
    console.log(`\n📊 Resource keys on this page (${resourceIds.length}):\n`)

    if (resourceIds.length === 0) {
        console.log('   No resource keys on this page.')
        return result
    }

    resourceIds.forEach((key, index) => {
        console.log(`   [${index}] ${bytes32ToString(key)} (${key})`)
    })

    return result
}
