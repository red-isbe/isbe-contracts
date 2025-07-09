import { task } from 'hardhat/config'
import { pause } from '../../scripts/pause/pause'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat pause --network localhost \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

task('pause', 'Pauses a deployed smart contract')
    .addParam('diamond', 'The diamond contract address')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        const signer = getSigner(hre)

        const result = await pause(diamond, signer)

        console.log('Pause result:', result)
    })
