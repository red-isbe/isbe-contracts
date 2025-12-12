import { task, types } from 'hardhat/config'
import { getResourceCount } from '../../../scripts/client/networkDirectory/getResourceCount'

/**
 npx hardhat getResourceCount --network localhost \
  --chain-id 2024 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getResourceCount', 'Gets the total count of resources for a network')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, diamond } = taskArgs

        await getResourceCount(chainId, diamond, hre.ethers.provider)
    })
