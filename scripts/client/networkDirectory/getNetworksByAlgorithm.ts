import { Provider } from 'ethers'
import {
    bytes32ToString,
    algorithmToString,
    stageToString,
    getNetworkDirectory,
} from './utils'
import { Algorithm } from './createNetwork'

export async function getNetworksByAlgorithm(
    algorithm: Algorithm,
    diamond: string,
    provider: Provider
) {
    if (algorithm < 0 || algorithm > 2) {
        throw new Error(
            `Invalid algorithm: ${algorithm}. Must be 0 (NONE), 1 (SECP256K1), or 2 (SECP256R1)`
        )
    }

    const contract = await getNetworkDirectory(diamond, provider)

    console.log(
        `📋 Getting networks by algorithm: ${algorithmToString(algorithm)}`
    )
    console.log(`   Diamond: ${diamond}`)

    const networks = await contract.getNetworksByAlgorithm(algorithm)

    console.log(
        `\n📊 Found ${networks.length} network(s) with ${algorithmToString(algorithm)}:\n`
    )

    if (networks.length === 0) {
        console.log('   No networks found with this algorithm.')
        return networks
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

    return networks
}
