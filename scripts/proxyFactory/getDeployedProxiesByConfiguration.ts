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
----------------------------------------------------------------------------------- */
import { ISignatureProvider } from '../../tasks/index'
import { getIsbeFactory } from '../../scripts/utils/getIsbeFactory'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function getDeployedProxiesByConfiguration(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    signatureProvider: ISignatureProvider,
    configurationId: string,
    version: number
): Promise<string[]> {
    console.log('📡 Querying deployed proxies by configuration...')

    const signer = await signatureProvider.getSigner()
    const isbeFactory = await getIsbeFactory(diamond, signer)

    try {
        const proxies = await isbeFactory.getDeployedProxiesByConfiguration(
            configurationId,
            version
        )

        if (!proxies || proxies.length === 0) {
            console.log(
                '⚠️  No proxies found for the given configuration and version'
            )
            return []
        }

        console.log(`✅ Found ${proxies.length} deployed proxy(ies)`)

        return proxies
    } catch (error) {
        console.error('❌ Failed to retrieve deployed proxies:', error)
        throw error
    }
}
