import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from 'hardhat/config'
import { quarantineExecutionNode } from '../../../scripts/client/besuNodeManager/quarantineExecution'

/*
npx hardhat quarantineExecutionNode \
  --node-id 0xc365af5738fb8e35d16a5e13e8e5396cda0536e533f4d04b78c2bc5510b5d389 \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task(
    'quarantineExecutionNode',
    'Quarantine an execution node in the BesuNodeManager.'
)
    .addParam(
        'nodeId',
        'The nodeId of the Execution Node to be quarantined.',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the contract')
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

            console.info('QUARANTINE EXECUTION NODE TASK')
            console.log(`Quarantining Execution Node:`)
            console.log(`   NodeId:  ${nodeId}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve:   ${signatureProvider.getCurveType()}`)

            const quarantinedNode: string = await quarantineExecutionNode(
                hre,
                signatureProvider,
                diamond,
                nodeId
            )

            console.log('\n✅ Execution Node quarantined successfully:')
            console.log(`   NodeId: ${quarantinedNode}`)
        }
    )
