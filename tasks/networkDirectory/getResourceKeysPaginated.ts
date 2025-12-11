import { task, types } from 'hardhat/config'
import { getResourceKeysPaginated } from '../../scripts/networkDirectory/getResourceKeysPaginated'

/**
 npx hardhat getResourceKeysPaginated --network localhost \
  --chain-id 2024 \
  --page-size 10 \
  --page-index 1 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getResourceKeysPaginated', 'Gets resource keys with pagination')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam('pageSize', 'Number of resources per page', undefined, types.int)
    .addParam('pageIndex', 'Page index (1-based)', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, pageSize, pageIndex, diamond } = taskArgs

        await getResourceKeysPaginated(
            chainId,
            pageSize,
            pageIndex,
            diamond,
            hre.ethers.provider
        )
    })
