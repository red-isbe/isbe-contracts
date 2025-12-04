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
    .addParam('diamond', 'The address of the contract')
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
