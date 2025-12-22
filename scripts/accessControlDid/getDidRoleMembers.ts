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

export async function getDidRoleMembers(
    role: string,
    page: number,
    pageSize: number,
    diamond: string,
    provider: Provider
) {
    const contract = await getAccessControlDid(diamond, provider)

    console.log('\n🔍 Getting DID Role Members...\n')
    console.log(`  Role:      ${role}`)
    console.log(`  Page:      ${page}`)
    console.log(`  Page Size: ${pageSize}`)
    console.log(`  Diamond:   ${diamond}`)
    console.log('')

    const dids = await contract.getDidRoleMembers(role, page, pageSize)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                  DID ROLE MEMBERS                         ')
    console.log('═══════════════════════════════════════════════════════════')

    console.log('\n📋 DIDs with this role:')
    if (dids.length === 0) {
        console.log('   (none)')
    } else {
        dids.forEach((did: string, index: number) => {
            const globalIndex = page * pageSize + index
            console.log(`   [${globalIndex}] ${did}`)
        })
    }

    console.log('')

    return { role, dids: dids.map((d: string) => d) }
}
