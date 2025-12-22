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

export async function getPaginatedStamped(
    pageSize: bigint | number,
    pageIndex: bigint | number,
    diamond: string,
    provider: Provider
) {
    const normalizedPageSize = BigInt(pageSize)
    const normalizedPageIndex = BigInt(pageIndex)
    const contract = await getTimeStampingRegistry(diamond, provider)

    console.log('📋 Getting paginated stamped data')
    console.log(`   Page Size: ${normalizedPageSize}`)
    console.log(`   Page Index: ${normalizedPageIndex}`)
    console.log(`   Diamond: ${diamond}`)

    const datas = await contract.getPaginatedStamped(
        normalizedPageSize,
        normalizedPageIndex
    )

    console.log(`\n📊 Found ${datas.length} TSR record(s) on this page:\n`)

    if (datas.length === 0) {
        console.log('   No records found on this page.')
        return datas
    }

    datas.forEach((data, index) => {
        console.log(`   ━━━ Record ${index + 1} ━━━`)
        console.log(`   Original Hash: ${data.originalHash}`)
        console.log(`   TSA Hash: ${data.tsaHash}`)
        console.log(`   External Reference ID: ${data.externalReferenceId}`)
        console.log('')
    })

    return datas
}
