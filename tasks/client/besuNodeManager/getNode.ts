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
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getNode } from '../../../scripts/client/besuNodeManager/getNode'
import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'

/*
npx hardhat getNode \
  --node-id 0x919ea79910a3668f4b1b1b7b833337a9ef65f1754f9ef2c227bffea0cf588722 \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task('getNode', 'Get node information by nodeId from BesuNodeManager.')
    .addParam(
        'nodeId',
        'The unique identifier of the node (keccak256 of enode).',
        undefined,
        types.string
    )
    .addOptionalParam(
        'diamond',
        'The address of the contract',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                nodeId: string
                diamond: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            const { nodeId, diamond } = taskArgs

            console.info('GET NODE TASK')
            console.log(`Retrieving node information:`)
            console.log(`   NodeId:  ${nodeId}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)

            const signatureProvider = SignatureProviderFactory.create(hre)

            const node = await getNode(hre, diamond, signatureProvider, nodeId)

            console.log('\n📋 Node Information:')
            console.log(`   NodeId:    ${node.nodeId}`)
            console.log(`   Enode:     ${node.enode}`)
            console.log(`   Timestamp: ${node.timestamp}`)
        }
    )
