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

export interface AnchoringStatsDTO {
    totalAnchors: bigint
    lastAnchoredBlock: bigint
    thisChainId: bigint
    anchoredChainId: bigint
}

export async function getAnchoringStats(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    signatureProvider: ISignatureProvider
): Promise<AnchoringStatsDTO> {
    console.log('📡 Querying anchoring statistics...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)

    try {
        const result = await anchoringCoreFacet.getAnchoringStats(chainIdNum)

        console.log('✅ Anchoring stats retrieved')
        console.log(`   Total Anchors: ${result._totalAnchors}`)
        console.log(`   Last Anchored Block: ${result._lastAnchoredBlock}`)
        console.log(`   This Chain ID: ${result._thisChainId}`)
        console.log(`   Anchored Chain ID: ${result._anchoredChainId}`)

        return {
            totalAnchors: result._totalAnchors,
            lastAnchoredBlock: result._lastAnchoredBlock,
            thisChainId: result._thisChainId,
            anchoredChainId: result._anchoredChainId,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve anchoring stats:', error)
        throw error
    }
}
