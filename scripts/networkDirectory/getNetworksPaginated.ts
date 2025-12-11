import { Provider } from 'ethers'
import {
    bytes32ToString,
    algorithmToString,
    stageToString,
    getNetworkDirectory,
} from './utils'

export async function getNetworksPaginated(
    pageSize: bigint | number,
    pageIndex: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedPageSize = BigInt(pageSize)
    const normalizedPageIndex = BigInt(pageIndex)

    const contract = getNetworkDirectory(diamond, provider)

    console.log('📋 Getting networks paginated')
    console.log(`   Page Size: ${normalizedPageSize}`)
    console.log(`   Page Index: ${normalizedPageIndex}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.getNetworksPaginated(
        normalizedPageSize,
        normalizedPageIndex
    )

    const [networks, totalCount, howMany, prev, next] = result

    console.log(`\n📊 Pagination Info:`)
    console.log(`   Total Count: ${totalCount}`)
    console.log(`   Returned: ${howMany}`)
    console.log(`   Previous Page: ${prev}`)
    console.log(`   Next Page: ${next}`)
    console.log(`\n📊 Networks on this page (${networks.length}):\n`)

    if (networks.length === 0) {
        console.log('   No networks on this page.')
        return result
    }

    networks.forEach((network, index) => {
        console.log(`   ━━━ Network ${index + 1} ━━━`)
        console.log(`   Chain ID: ${network.chainId}`)
        console.log(`   Name: ${bytes32ToString(network.name)}`)
        console.log(`   Symbol: ${bytes32ToString(network.symbol)}`)
        console.log(
            `   Algorithm: ${algorithmToString(Number(network.algorithm))}`
        )
        console.log(`   Stage: ${stageToString(Number(network.stage))}`)
        console.log(`   Resources: ${network.resources.length}`)
        console.log('')
    })

    return result
}
