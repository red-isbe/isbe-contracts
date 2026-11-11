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

export async function getTsrTimestamp(
    originalHash: string,
    diamond: string,
    provider: Provider
) {
    const contract = await getTimeStampingRegistry(diamond, provider)

    console.log('🕒 Getting TSR timestamp for original hash')
    console.log(`   Original Hash: ${originalHash}`)
    console.log(`   Diamond: ${diamond}`)

    try {
        const timestamp = await contract.getTsrTimestamp(originalHash)
        const utc = new Date(Number(timestamp) * 1000).toISOString()

        console.log('\n📊 TSR Timestamp:')
        console.log(`   Unix: ${timestamp.toString()}`)
        console.log(`   UTC:  ${utc}`)

        return { timestamp, utc }
    } catch (error) {
        if (error instanceof Error && error.message.includes('HashNotFound')) {
            console.log('\n❌ Original hash not found in the registry')
            return null
        }
        throw error
    }
}
