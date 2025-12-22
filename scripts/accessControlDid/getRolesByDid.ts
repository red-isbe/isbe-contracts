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

export async function getRolesByDid(
    did: string,
    page: number,
    pageSize: number,
    diamond: string,
    provider: Provider
) {
    const contract = await getAccessControlDid(diamond, provider)

    console.log('\n🔍 Getting Roles by DID...\n')
    console.log(`  DID:       ${did}`)
    console.log(`  Page:      ${page}`)
    console.log(`  Page Size: ${pageSize}`)
    console.log(`  Diamond:   ${diamond}`)
    console.log('')

    const roles = await contract.getRolesByDid(did, page, pageSize)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                   ROLES BY DID                            ')
    console.log('═══════════════════════════════════════════════════════════')

    console.log('\n📋 Roles:')
    if (roles.length === 0) {
        console.log('   (none)')
    } else {
        roles.forEach((role: string, index: number) => {
            const globalIndex = page * pageSize + index
            console.log(`   [${globalIndex}] ${role}`)
        })
    }

    console.log('')

    return { did, roles: roles.map((r: string) => r) }
}
