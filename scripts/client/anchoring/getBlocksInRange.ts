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
import { BlockInfo } from './getAnchoredBlock'

export async function getBlocksInRange(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    fromblock: string,
    toblock: string,
    signatureProvider: ISignatureProvider
): Promise<BlockInfo[]> {
    console.log('📡 Querying blocks in range...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const fromBlockNum = Number(fromblock)
    const toBlockNum = Number(toblock)

    try {
        const result = await anchoringCoreFacet.getBlocksInRange(
            chainIdNum,
            fromBlockNum,
            toBlockNum
        )

        console.log(`✅ Retrieved ${result.length} blocks in range`)
        console.log(`   Chain ID: ${chainid}`)
        console.log(`   From Block: ${fromblock}`)
        console.log(`   To Block: ${toblock}`)

        return result.map((block) => ({
            blockNumber: block.blockNumber,
            blockHash: block.blockHash,
            stateRoot: block.stateRoot,
            timestamp: block.timestamp,
            anchorer: block.anchorer,
        }))
    } catch (error) {
        console.error('❌ Failed to retrieve blocks in range:', error)
        throw error
    }
}
