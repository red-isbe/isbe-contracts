import { task, types } from 'hardhat/config'
import { getNetworksPaginated } from '../../../scripts/client/networkDirectory/getNetworksPaginated'

/**
 npx hardhat getNetworksPaginated --network localhost \
  --page-size 10 \
  --page-index 1 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getNetworksPaginated', 'Gets networks with pagination')
    .addParam('pageSize', 'Number of networks per page', undefined, types.int)
    .addParam('pageIndex', 'Page index (1-based)', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { pageSize, pageIndex, diamond } = taskArgs

        await getNetworksPaginated(
            pageSize,
            pageIndex,
            diamond,
            hre.ethers.provider
        )
    })
