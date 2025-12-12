import { task } from 'hardhat/config'
import { getStampedSize } from '../../../scripts/client/timestamping/getStampedSize'

/**
 npx hardhat getStampedSize --network localhost \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'getStampedSize',
    'Gets the total number of stamped entries in the TimeStampingRegistry'
)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        await getStampedSize(diamond, hre.ethers.provider)
    })
