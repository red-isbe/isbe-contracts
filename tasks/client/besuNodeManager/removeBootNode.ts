import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { removeBootNode } from '../../../scripts/client/besuNodeManager/removeBootNode'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from 'hardhat/config'

/*
npx hardhat removeBootNode \
  --node-id 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task('removeBootNode', 'Remove a boot node from the BesuNodeManager.')
    .addParam(
        'nodeId',
        'The id of the Besu Boot Node.',
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

            console.info('REMOVE BOOT NODE TASK')
            console.log(`Removing Besu Boot Node with id: ${nodeId}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve: ${signatureProvider.getCurveType()}`)

            const id: string = await removeBootNode(
                hre,
                signatureProvider,
                diamond,
                nodeId
            )

            console.log('\n✅ Boot Node removed successfully:')
            console.log(`   NodeId: ${id}`)
        }
    )
