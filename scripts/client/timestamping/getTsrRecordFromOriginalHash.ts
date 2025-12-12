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
import { getTimeStampingRegistry } from './utils'

export async function getTsrRecordFromOriginalHash(
    originalHash: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getTimeStampingRegistry(diamond, provider)

    console.log('📋 Getting TSR record for original hash')
    console.log(`   Original Hash: ${originalHash}`)
    console.log(`   Diamond: ${diamond}`)

    try {
        const [tsrData, authority, requester] =
            await contract.getTsrRecordFromOriginalHash(originalHash)

        console.log('\n📊 TSR Record:')
        console.log(`   Original Hash: ${tsrData.originalHash}`)
        console.log(`   TSA Hash: ${tsrData.tsaHash}`)
        console.log(`   External Reference ID: ${tsrData.externalReferenceId}`)
        console.log(`   Authority: ${authority}`)
        console.log(`   Requester: ${requester}`)

        return { tsrData, authority, requester }
    } catch (error) {
        if (error instanceof Error && error.message.includes('HashNotFound')) {
            console.log('\n❌ Hash not found in the registry')
            return null
        }
        throw error
    }
}
