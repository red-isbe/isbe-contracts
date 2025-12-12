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
import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { removeValidator } from '../../../scripts/client/besuNodeManager/removeValidator'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from 'hardhat/config'

/*
npx hardhat removeValidator \
  --node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task('removeValidator', 'Remove a validator node from the BesuNodeManager.')
    .addParam(
        'nodeId',
        'The nodeId of the Validator Node to remove.',
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
            console.log(
                '🔐 Initializing signature provider for access control...'
            )
            const signatureProvider = SignatureProviderFactory.create(hre)

            const { nodeId, diamond } = taskArgs

            console.info('REMOVE VALIDATOR TASK')
            console.log(`Removing Besu Validator Node with id: ${nodeId}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve: ${signatureProvider.getCurveType()}`)

            const id: string = await removeValidator(
                hre,
                signatureProvider,
                diamond,
                nodeId
            )

            console.log('\n✅ Validator Node removed successfully:')
            console.log(`   NodeId: ${id}`)
        }
    )
