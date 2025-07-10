import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { unpause } from '../../scripts/pause/unpause'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat unpause --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('unpause', 'Unpauses a deployed smart contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = getSigner(hre)

        const result = await unpause(diamond, signer)

        console.log('Unpause result:', result)
    })
