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
import { getDidController } from '../did/utils'

export async function checkControllerByDid(
    did: string,
    controller: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getDidController(diamond, provider)

    console.log('\n🔍 Checking Controller (bytes32 format)...\n')
    console.log(`  DID:        ${did}`)
    console.log(`  Controller: ${controller}`)
    console.log(`  Diamond:    ${diamond}`)
    console.log('')

    const isController = await contract['checkController(bytes32,address)'](
        did,
        controller
    )

    console.log('═══════════════════════════════════════════════════════════')
    console.log('                CONTROLLER CHECK RESULT                     ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log(`  Is Controller: ${isController ? '✅ YES' : '❌ NO'}`)
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')

    return { did, controller, isController }
}
