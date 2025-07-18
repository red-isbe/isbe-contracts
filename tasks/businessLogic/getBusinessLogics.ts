import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getBusinessLogics } from '../../scripts/businessLogic/getBusinessLogics'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getBusinessLogics --network localhost \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

dotenv.config()

task('getBusinessLogics', 'Deploys business logic contract')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { factory } = taskArgs

        const signer = await getSigner(hre)

        const result = await getBusinessLogics(factory, signer)

        console.log('Business Logics:', result)
    })
