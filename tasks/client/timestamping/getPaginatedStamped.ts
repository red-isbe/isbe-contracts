import { task, types } from 'hardhat/config'
import { getPaginatedStamped } from '../../../scripts/client/timestamping/getPaginatedStamped'

/**
 npx hardhat getPaginatedStamped --network localhost \
  --page-size 10 \
  --page-index 1 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getPaginatedStamped', 'Gets a paginated list of stamped TSR data')
    .addParam(
        'pageSize',
        'The number of items to retrieve per page',
        10,
        types.int
    )
    .addParam(
        'pageIndex',
        'The index of the page to retrieve (0-based)',
        0,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { pageSize, pageIndex, diamond } = taskArgs

        await getPaginatedStamped(
            pageSize,
            pageIndex,
            diamond,
            hre.ethers.provider
        )
    })
