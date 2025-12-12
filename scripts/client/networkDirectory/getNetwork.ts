import { Provider } from 'ethers'
import {
    bytes32ToString,
    algorithmToString,
    stageToString,
    getNetworkDirectory,
} from './utils'

export async function getNetwork(
    chainId: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedChainId = BigInt(chainId)
    const contract = await getNetworkDirectory(diamond, provider)

    console.log(`📋 Getting network with Chain ID: ${normalizedChainId}`)
    console.log(`   Diamond: ${diamond}`)

    const network = await contract.getNetwork(normalizedChainId)

    console.log('\n📊 Network Details:')
    console.log(`   Chain ID: ${network.chainId}`)
    console.log(`   Name: ${bytes32ToString(network.name)} (${network.name})`)
    console.log(
        `   Symbol: ${bytes32ToString(network.symbol)} (${network.symbol})`
    )
    console.log(
        `   Algorithm: ${algorithmToString(Number(network.algorithm))} (${network.algorithm})`
    )
    console.log(
        `   Stage: ${stageToString(Number(network.stage))} (${network.stage})`
    )
    console.log(`   Resources: ${network.resources.length}`)

    if (network.resources.length > 0) {
        console.log('\n   📦 Resources:')
        network.resources.forEach((r, i) => {
            console.log(
                `      [${i}] ${bytes32ToString(r.resourceId)}: ${r.resource}`
            )
        })
    }

    return network
}
