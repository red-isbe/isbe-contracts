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

export async function getNetworksPaginated(
    pageSize: bigint | number,
    pageIndex: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedPageSize = BigInt(pageSize)
    const normalizedPageIndex = BigInt(pageIndex)

    const contract = await getNetworkDirectory(diamond, provider)

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
