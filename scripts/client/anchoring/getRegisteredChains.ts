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

export interface RegisteredChainsDTO {
    thisChainId: bigint
    registeredChainIds: bigint[]
}

export async function getRegisteredChains(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    pageindex: string,
    pagelength: string,
    signatureProvider: ISignatureProvider
): Promise<RegisteredChainsDTO> {
    console.log('📡 Querying registered chains...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const pageIndexNum = Number(pageindex)
    const pageLengthNum = Number(pagelength)

    try {
        const result = await anchoringCoreFacet.getRegisteredChains(
            pageIndexNum,
            pageLengthNum
        )

        console.log(`✅ Retrieved registered chains`)
        console.log(`   This Chain ID: ${result._thisChainId}`)
        console.log(
            `   Registered Chains: ${result._registeredChainIds.length}`
        )
        console.log(`   Page: ${pageIndexNum}, Length: ${pageLengthNum}`)

        return {
            thisChainId: result._thisChainId,
            registeredChainIds: result._registeredChainIds,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve registered chains:', error)
        throw error
    }
}
