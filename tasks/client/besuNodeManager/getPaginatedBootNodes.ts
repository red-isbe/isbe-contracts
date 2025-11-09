import { task, types } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getPaginatedBootNodes } from '../../../scripts/client/besuNodeManager/getPaginatedBootNodes'

/**
 * Gets the paginated list of BootNodes filtered by state.
 npx hardhat getPaginatedBootNodes --network dev \
 --besu-node-manager-address "0xCc979C27AeB74D13f73B2621b799b7221c1C9B4C" \
 --state 1 \
 --page-size 10 \
 --page-index 1
 */
task('getPaginatedBootNodes', 'Retrieves BootNodes from the BesuNodeManager.')
    .addParam(
        'besuNodeManagerAddress',
        'The address of the BesuNodeManager.',
        undefined,
        types.string
    )
    .addParam('state', '1: ACTIVE, 2: QUARANTINE', 1, types.int)
    .addParam('pageSize', 'The number of BootNodes per page.', 10, types.int)
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
            const result = await getPaginatedBootNodes(
                besuNodeManagerAddress,
                state,
                pageSize,
                pageIndex,
                signer
            )
            console.log('BootNodes retrieved successfully.')
            console.log('Paginated BootNodes: ', result)
        }
    )
