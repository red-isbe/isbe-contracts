import { task } from 'hardhat/config'
import { getAllNetworks } from '../../../scripts/client/networkDirectory/getAllNetworks'

/**
 npx hardhat getAllNetworks --network localhost \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getAllNetworks', 'Gets all networks from the NetworkDirectory')
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        await getAllNetworks(diamond, hre.ethers.provider)
    })
