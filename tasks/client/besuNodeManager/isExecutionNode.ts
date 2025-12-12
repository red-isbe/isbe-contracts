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
import { getSigner } from '../../../scripts/utils/getSigner'
import { isExecutionNode } from '../../../scripts/client/besuNodeManager/isExecutionNode'

/**
 * Gets status of a node.
 npx hardhat isExecutionNode --network dev \
 --besu-node-manager-address "0xCc979C27AeB74D13f73B2621b799b7221c1C9B4C" \
 --node-id 0x7b50131c7609742dd42cb405c9b165cd1789bac874b7d1a39b31ed8e6d475088
 */
task(
    'isExecutionNode',
    'Retrieves state of a ExecutionNode from the BesuNodeManager.'
)
    .addParam(
        'besuNodeManagerAddress',
        'The address of the BesuNodeManager.',
        undefined,
        types.string
    )
    .addParam(
        'nodeId',
        'Node identifier for the ExecutionNode',
        undefined,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                besuNodeManagerAddress: string
                nodeId: string
            },
            hre
        ) => {
            const { besuNodeManagerAddress, nodeId } = taskArgs
            const signer = await getSigner(hre)
            const ExecutionNode = await isExecutionNode(
                besuNodeManagerAddress,
                nodeId,
                signer
            )
            console.log('Is a ExecutionNode: ', ExecutionNode)
        }
    )
