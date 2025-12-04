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
        'The id of the Besu Validator Node.',
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
