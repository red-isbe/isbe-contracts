import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getBusinessLogics } from '../../scripts/businessLogic/getBusinessLogics'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getBusinessLogics --network localhost \
  --factory "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

dotenv.config()

task('getBusinessLogics', 'Deploys business logic contract')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { factory } = taskArgs

        const signer = getSigner(hre)

        const result = await getBusinessLogics(factory, signer)

        console.log('Business Logics:', result)
    })
