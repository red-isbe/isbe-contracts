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
import { getEnsRegistry } from './utils'

export async function resolver(
    node: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getEnsRegistry(diamond, provider)

    console.log('📋 Getting ENS node resolver')
    console.log(`   Node: ${node}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.resolver(node)
    console.log(`\n📊 Resolver: ${result}`)
    return result
}
