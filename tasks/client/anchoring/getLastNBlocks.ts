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
import { task, types } from 'hardhat/config'
import { getLastNBlocks } from '../../../scripts/client/anchoring/getLastNBlocks'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:getlastnblocks \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --count 5 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getlastnblocks',
    'Prepare parameters for calling IAnchoringCore.getLastNBlocks'
)
    .addOptionalParam(
        'governancediamond',
        'Address of the Governance Diamond',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .addParam(
        'chainid',
        'Chain ID to query (_chainId, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'count',
        'Number of blocks to retrieve (_count, uint256)',
        undefined,
        types.string
    )
    .setAction(async ({ governancediamond, chainid, count }, hre) => {
        console.log('anchoringcorefacet:getlastnblocks')
        console.log('Target Governance Diamond:', governancediamond)
        console.log(
            'Function: getLastNBlocks(uint256 _chainId, uint256 _count)'
        )
        console.log('Parameters:')
        console.log('  _chainId:', chainid.toString())
        console.log('  _count  :', count.toString())
        console.log(`Network: ${hre.network.name}`)

        const signatureProvider = SignatureProviderFactory.create(hre)
        console.log(`Curve: ${signatureProvider.getCurveType()}`)

        const result = await getLastNBlocks(
            hre,
            governancediamond,
            chainid,
            count,
            signatureProvider
        )

        console.log('\n✅ getLastNBlocks result:')
        console.log(`  Total blocks: ${result.length}`)

        result.forEach((block, index) => {
            console.log(`\n  Block #${index}:`)
            console.log(`    blockNumber: ${block.blockNumber.toString()}`)
            console.log(`    blockHash  : ${block.blockHash}`)
            console.log(`    stateRoot  : ${block.stateRoot}`)
            console.log(`    timestamp  : ${block.timestamp.toString()}`)
            console.log(`    anchorer   : ${block.anchorer}`)
        })
    })
