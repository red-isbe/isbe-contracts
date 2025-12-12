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
import { getNetworkDirectory } from './utils'

export async function getNetworksCount(diamond: string, provider: Provider) {
    const contract = await getNetworkDirectory(diamond, provider)

    console.log('📋 Getting networks count')
    console.log(`   Diamond: ${diamond}`)

    const count = await contract.getNetworksCount()

    console.log(`\n📊 Total Networks: ${count}`)
    return count
}
