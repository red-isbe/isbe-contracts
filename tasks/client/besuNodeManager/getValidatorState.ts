import { task, types } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getValidatorState } from '../../../scripts/client/besuNodeManager/getValidatorState'

/**
 * Gets status of a node.
 npx hardhat getValidatorState --network dev \
 --besu-node-manager-address "0xCc979C27AeB74D13f73B2621b799b7221c1C9B4C" \
 --node-id 0x7b50131c7609742dd42cb405c9b165cd1789bac874b7d1a39b31ed8e6d475088
 */
task(
    'getValidatorState',
    'Retrieves state of a validator from the BesuNodeManager.'
)
    .addParam(
        'besuNodeManagerAddress',
        'The address of the BesuNodeManager.',
        undefined,
        types.string
    )
    .addParam(
        'nodeId',
        'Node identifier for the validator',
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
            const validatorState = await getValidatorState(
                besuNodeManagerAddress,
                nodeId,
                signer
            )
            console.log('Validator state: ', validatorState)
        }
    )
