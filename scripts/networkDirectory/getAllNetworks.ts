import { Provider } from 'ethers'
import {
    bytes32ToString,
    algorithmToString,
    stageToString,
    getNetworkDirectory,
} from './utils'

export async function getAllNetworks(diamond: string, provider: Provider) {
    const contract = getNetworkDirectory(diamond, provider)

    console.log('📋 Getting all networks')
    console.log(`   Diamond: ${diamond}`)

    const networks = await contract.getAllNetworks()

    console.log(`\n📊 Found ${networks.length} network(s):\n`)

    if (networks.length === 0) {
        console.log('   No networks registered.')
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
        if (network.resources.length > 0) {
            network.resources.forEach((r) => {
                console.log(
                    `      • ${bytes32ToString(r.resourceId)}: ${r.resource}`
                )
            })
        }
        console.log('')
    })

    return networks
}
