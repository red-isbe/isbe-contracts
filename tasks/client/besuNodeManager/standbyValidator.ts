import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { task, types } from 'hardhat/config'
import { standbyValidator } from '../../../scripts/client/besuNodeManager/standbyValidator'

/*
npx hardhat standbyValidator \
  --node-id 0xc365af5738fb8e35d16a5e13e8e5396cda0536e533f4d04b78c2bc5510b5d389 \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task(
    'standbyValidator',
    'Move a validator node to standby state in the BesuNodeManager.'
)
    .addParam(
        'nodeId',
        'The nodeId of the Validator Node to move to standby.',
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
            console.log('🔐 Initializing signature provider for access control...')
            const signatureProvider = SignatureProviderFactory.create(hre)

            const { nodeId, diamond } = taskArgs

            console.info('STANDBY VALIDATOR TASK')
            console.log(`Moving Validator Node to Standby:`)
            console.log(`   NodeId:  ${nodeId}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve:   ${signatureProvider.getCurveType()}`)

            const standbyNode: string = await standbyValidator(
                hre,
                signatureProvider,
                diamond,
                nodeId
            )

            console.log('\n✅ Validator Node moved to standby successfully:')
            console.log(`   NodeId: ${standbyNode}`)
        }
    )
