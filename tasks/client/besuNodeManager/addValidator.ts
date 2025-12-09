import { addValidator } from '../../../scripts/client/besuNodeManager/addValidator'
import { SignatureProviderFactory } from '../../../tasks/deployment/providers/SignatureProviderFactory'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { isValidEnode } from '../../../scripts/utils/validation'

/*
npx hardhat addValidator \
  --enode enode://8892b3cc26ce2a9b48e8847ce4a3e16411a1d73f4abc361736baac8a507982f0e15daaa2746720a7f43a49984405bf870046c179982a0fd45b9fe8f4df22aa86@172.16.240.32:30306 \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task('addValidator', 'Add a new validator node to the BesuNodeManager.')
    .addParam(
        'enode',
        'The enode string of the Besu Validator Node.',
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
                enode: string
                diamond: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            const { enode, diamond } = taskArgs

            if (!isValidEnode(enode))
                throw new Error('Invalid enode format: ' + enode)
            console.log(
                '🔐 Initializing signature provider for access control...'
            )
            const signatureProvider = SignatureProviderFactory.create(hre)

            console.info('ADD VALIDATOR TASK')
            console.log(`Adding Besu Validator Node:`)
            console.log(`   Enode:   ${enode}`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Network: ${hre.network.name}`)
            console.log(`   Curve:   ${signatureProvider.getCurveType()}`)

            const {
                nodeId: id,
                enode: evEnode,
                timestamp: evTimestamp,
                state: evState,
            } = await addValidator(hre, signatureProvider, diamond, enode)

            console.log('\n✅ Validator Node added successfully:')
            console.log(`   ID:        ${id}`)
            console.log(`   Enode:       ${evEnode}`)
            console.log(`   Timestamp:   ${evTimestamp}`)
            console.log(`   State:       ${evState}`)
        }
    )
