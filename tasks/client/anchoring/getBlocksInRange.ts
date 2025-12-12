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
import { getBlocksInRange } from '../../../scripts/client/anchoring/getBlocksInRange'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat anchoringcorefacet:getblocksinrange \
  --governancediamond 0x00000000000000000000000000000000000015BE \
  --chainid 1 \
  --fromblock 100 \
  --toblock 110 \
  --network genesis_validation_network_k1
*/

task(
    'anchoringcorefacet:getblocksinrange',
    'Prepare parameters for calling IAnchoringCore.getBlocksInRange'
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
        'fromblock',
        'Starting block number (_fromBlock, uint256)',
        undefined,
        types.string
    )
    .addParam(
        'toblock',
        'Ending block number (_toBlock, uint256)',
        undefined,
        types.string
    )
    .setAction(
        async ({ governancediamond, chainid, fromblock, toblock }, hre) => {
            console.log('anchoringcorefacet:getblocksinrange')
            console.log('Target Governance Diamond:', governancediamond)
            console.log(
                'Function: getBlocksInRange(uint256 _chainId, uint256 _fromBlock, uint256 _toBlock)'
            )
            console.log('Parameters:')
            console.log('  _chainId   :', chainid.toString())
            console.log('  _fromBlock :', fromblock.toString())
            console.log('  _toBlock   :', toblock.toString())
            console.log(`Network: ${hre.network.name}`)

            const signatureProvider = SignatureProviderFactory.create(hre)
            console.log(`Curve: ${signatureProvider.getCurveType()}`)

            const result = await getBlocksInRange(
                hre,
                governancediamond,
                chainid,
                fromblock,
                toblock,
                signatureProvider
            )

            console.log('\n✅ getBlocksInRange result:')
            console.log(`  Total blocks: ${result.length}`)

            result.forEach((block, index) => {
                console.log(`\n  Block #${index}:`)
                console.log(`    blockNumber: ${block.blockNumber.toString()}`)
                console.log(`    blockHash  : ${block.blockHash}`)
                console.log(`    stateRoot  : ${block.stateRoot}`)
                console.log(`    timestamp  : ${block.timestamp.toString()}`)
                console.log(`    anchorer   : ${block.anchorer}`)
            })
        }
    )
