import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { unpauseIsbe } from '../../scripts/globalPause/unpauseIsbe'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat unpauseIsbe --network localhost \
  --proxy-address "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
  --factory "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

dotenv.config()

task('unpauseIsbe', 'Pauses a deployed smart contract')
    .addParam('proxyAddress', 'The address of the contract to pause')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { proxyAddress, factory } = taskArgs

        const signer = getSigner(hre)

        // Call the deploy script and display the result
        const result = await unpauseIsbe(proxyAddress, factory, signer)

        console.log('UnPause result:', result)
    })
