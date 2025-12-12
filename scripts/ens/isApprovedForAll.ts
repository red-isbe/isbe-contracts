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

export async function isApprovedForAll(
    owner: string,
    operator: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getEnsRegistry(diamond, provider)

    console.log(`📋 Checking operator approval`)
    console.log(`   Owner: ${owner}`)
    console.log(`   Operator: ${operator}`)
    console.log(`   Diamond: ${diamond}`)

    const result = await contract.isApprovedForAll(owner, operator)
    console.log(`\n📊 Is Approved For All: ${result ? '✅ YES' : '❌ NO'}`)
    return result
}
