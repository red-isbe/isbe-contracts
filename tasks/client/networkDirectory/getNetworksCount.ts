import { task } from 'hardhat/config'
import { getNetworksCount } from '../../../scripts/client/networkDirectory/getNetworksCount'

/**
 npx hardhat getNetworksCount --network localhost \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getNetworksCount', 'Gets the total count of networks')
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        await getNetworksCount(diamond, hre.ethers.provider)
    })
