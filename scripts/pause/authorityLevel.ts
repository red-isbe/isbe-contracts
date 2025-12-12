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
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ISignatureProvider } from '../../tasks/index'
import { getPause } from '../utils/getPause'

export async function getAuthorityLevel(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string
): Promise<bigint> {
    console.log('📡 Querying authority level...')

    // Use signer to connect to the contract
    const signer = await signatureProvider.getSigner()

    const pauseContract = await getPause(diamond, signer)

    try {
        const level = await pauseContract.authorityLevel()

        console.log('✅ Authority level retrieved')

        return level
    } catch (error) {
        console.error('❌ Failed to retrieve authority level:', error)
        throw error
    }
}
