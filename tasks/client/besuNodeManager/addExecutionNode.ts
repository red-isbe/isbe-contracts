import { addExecutionNode } from '../../../scripts/client/besuNodeManager/addExecutionNode'
import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

/*
npx hardhat addExecutionNode \
  --enode enode://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@1.2.3.4:30303 \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task('addExecutionNode', 'Add a new execution node to the BesuNodeManager.')
    .addParam(
        'enode',
        'The enode string of the Besu Execution Node.',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the contract')
    .setAction(
        async (
            taskArgs: {
                enode: string
                diamond: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            console.log(
                '🔐 Initializing signature provider for access control...'
            )
            const signatureProvider = SignatureProviderFactory.create(hre)

            const { enode, diamond } = taskArgs

            console.info('ADD EXECUTION NODE TASK')
            console.log(`Adding Besu Execution Node:`)
            console.log(`   Enode:   ${enode}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve:   ${signatureProvider.getCurveType()}`)

            const {
                nodeId: id,
                enode: evEnode,
                timestamp: evTimestamp,
                state: evState,
            } = await addExecutionNode(hre, signatureProvider, diamond, enode)

            console.log('\n✅ Execution Node added successfully:')
            console.log(`   ID:        ${id}`)
            console.log(`   Enode:       ${evEnode}`)
            console.log(`   Timestamp:   ${evTimestamp}`)
            console.log(`   State:       ${evState}`)
        }
    )
