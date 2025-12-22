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
