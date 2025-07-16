import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { isPaused } from '../../scripts/pause/isPaused'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat isPaused --network localhost \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('isPaused', 'Deploys business logic contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = getSigner(hre)

        const result = await isPaused(diamond, signer)

        console.log('Is Paused:', result)
    })
