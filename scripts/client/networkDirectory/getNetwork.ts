/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-------------------------------------------------------------- */
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
