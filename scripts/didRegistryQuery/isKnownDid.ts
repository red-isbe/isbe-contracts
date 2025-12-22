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
import { getDidRegistryQuery } from '../did/utils'

export async function isKnownDid(
    account: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidRegistryQuery(diamond, provider)

    console.log('\n🔍 Checking known DID...\n')
    console.log(`  Account: ${account}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const isKnown = await contract.isKnownDid(account)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                      IS KNOWN DID                         ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`  Result: ${isKnown}`)
    console.log('═══════════════════════════════════════════════════════════\n')

    return { account, isKnown }
}
