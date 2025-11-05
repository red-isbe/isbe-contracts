import { task, types } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getPaginatedValidators } from '../../../scripts/client/besuNodeManager/getPaginatedValidators'

/**
 * Gets the paginated list of validators filtered by state.
 npx hardhat getPaginatedValidators --network dev \
 --besu-node-manager-address "0xCc979C27AeB74D13f73B2621b799b7221c1C9B4C" \
 --state 1 \
 --page-size 10 \
 --page-index 1
 */
task('getPaginatedValidators', 'Retrieves validators from the BesuNodeManager.')
    .addParam(
        'besuNodeManagerAddress',
        'The address of the BesuNodeManager.',
        undefined,
        types.string
    )
    .addParam('state', '1: ACTIVE, 2: STANDBY, 3: QUARANTINE', 1, types.int)
    .addParam('pageSize', 'The number of validators per page.', 10, types.int)
    .addParam('pageIndex', 'The page index.', 1, types.int)
    .setAction(
        async (
            taskArgs: {
                besuNodeManagerAddress: string
                state: number
                pageSize: number
                pageIndex: number
            },
            hre
        ) => {
            const { besuNodeManagerAddress, state, pageSize, pageIndex } =
                taskArgs
            const signer = await getSigner(hre)
            const result = await getPaginatedValidators(
                besuNodeManagerAddress,
                state,
                pageSize,
                pageIndex,
                signer
            )
            console.log('Validators retrieved successfully.')
            console.log('Paginated validators: ', result)
        }
    )
