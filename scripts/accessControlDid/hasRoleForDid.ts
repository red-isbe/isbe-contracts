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
import { getAccessControlDid } from './utils'

export async function hasRoleForDid(
    role: string,
    did: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getAccessControlDid(diamond, provider)

    console.log('\n🔍 Checking Role for DID...\n')
    console.log(`  Role:    ${role}`)
    console.log(`  DID:     ${did}`)
    console.log(`  Diamond: ${diamond}`)
    console.log('')

    const hasRole = await contract.hasRoleForDid(role, did)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                  HAS ROLE FOR DID                         ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`\n  Result: ${hasRole ? '✅ YES' : '❌ NO'}`)
    console.log('')

    return { role, did, hasRole }
}
