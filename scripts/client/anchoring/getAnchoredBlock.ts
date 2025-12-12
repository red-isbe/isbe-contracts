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

export interface BlockInfo {
    blockNumber: bigint
    blockHash: string
    stateRoot: string
    timestamp: bigint
    anchorer: string
}

export async function getAnchoredBlock(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    blocknumber: string,
    signatureProvider: ISignatureProvider
): Promise<BlockInfo> {
    console.log('📡 Querying anchored block information...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const blockNumberNum = Number(blocknumber)

    try {
        const blockInfo = await anchoringCoreFacet.getAnchoredBlock(
            chainIdNum,
            blockNumberNum
        )

        if (
            !blockInfo ||
            blockInfo.blockNumber === 0n ||
            blockInfo.blockHash === hre.ethers.ZeroHash
        ) {
            throw new Error(
                `Block ${blocknumber} from chain ${chainid} not found or not anchored`
            )
        }

        console.log('✅ Anchored block found')
        console.log(`   Chain ID: ${chainid}`)
        console.log(`   Block Number: ${blockInfo.blockNumber}`)
        console.log(`   Block Hash: ${blockInfo.blockHash}`)
        console.log(`   State Root: ${blockInfo.stateRoot}`)
        console.log(`   Timestamp: ${blockInfo.timestamp}`)
        console.log(`   Anchorer: ${blockInfo.anchorer}`)

        return {
            blockNumber: blockInfo.blockNumber,
            blockHash: blockInfo.blockHash,
            stateRoot: blockInfo.stateRoot,
            timestamp: blockInfo.timestamp,
            anchorer: blockInfo.anchorer,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve anchored block:', error)
        throw error
    }
}
