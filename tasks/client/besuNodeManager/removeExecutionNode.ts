import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { removeExecutionNode } from '../../../scripts/client/besuNodeManager/removeExecutionNode'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from 'hardhat/config'

/*
npx hardhat removeExecutionNode \
  --execution-node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task(
    'removeExecutionNode',
    'Remove an execution node from the BesuNodeManager.'
)
    .addParam(
        'executionNodeId',
        'The id of the Besu Execution Node.',
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
                executionNodeId: string
                diamond: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            console.log(
                '🔐 Initializing signature provider for access control...'
            )
            const signatureProvider = SignatureProviderFactory.create(hre)

            const { executionNodeId, diamond } = taskArgs

            console.info('REMOVE EXECUTION NODE TASK    ')
            console.log(
                `Removing Besu Execution Node with id: ${executionNodeId}`
            )
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve: ${signatureProvider.getCurveType()}`)

            const id: string = await removeExecutionNode(
                hre,
                signatureProvider,
                diamond,
                executionNodeId
            )

            console.log('\n✅ Execution Node removed successfully:')
            console.log(`   Role: ${id}`)
        }
    )
