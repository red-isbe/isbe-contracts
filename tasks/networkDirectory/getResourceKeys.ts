import { task, types } from 'hardhat/config'
import { getResourceKeys } from '../../scripts/networkDirectory/getResourceKeys'

/**
 npx hardhat getResourceKeys --network localhost \
  --chain-id 2024 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getResourceKeys', 'Gets all resource keys for a network')
    .addParam(
        'chainId',
        'The chain ID of the network (uint256)',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { chainId, diamond } = taskArgs

        await getResourceKeys(chainId, diamond, hre.ethers.provider)
    })
