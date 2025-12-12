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
import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function isBlockAnchored(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    blocknumber: string,
    signatureProvider: ISignatureProvider
): Promise<boolean> {
    console.log('📡 Checking if block is anchored...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const blockNumberNum = Number(blocknumber)

    try {
        const result = await anchoringCoreFacet.isBlockAnchored(
            chainIdNum,
            blockNumberNum
        )

        console.log(
            `✅ Block ${blocknumber} on chain ${chainid} is ${result ? 'ANCHORED' : 'NOT ANCHORED'}`
        )

        return result
    } catch (error) {
        console.error('❌ Failed to check if block is anchored:', error)
        throw error
    }
}
