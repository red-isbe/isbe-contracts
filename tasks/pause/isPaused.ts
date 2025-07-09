import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { isPaused } from '../../scripts/pause/isPaused'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat isPaused --network localhost \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
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
