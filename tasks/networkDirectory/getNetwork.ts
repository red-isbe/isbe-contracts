import { task, types } from 'hardhat/config'
import { getNetwork } from '../../scripts/networkDirectory/getNetwork'

/**
 npx hardhat getNetwork --network localhost \
  --chain-id 2024 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getNetwork', 'Gets a specific network from the NetworkDirectory')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, diamond } = taskArgs

        await getNetwork(chainId, diamond, hre.ethers.provider)
    })
