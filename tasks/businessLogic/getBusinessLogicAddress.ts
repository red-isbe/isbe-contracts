import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getBusinessLogicAddress } from '../../scripts/businessLogic/getBusinessLogicAddress'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getBusinessLogicAddress --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --factory "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" \
  --business-version "1"
 */

dotenv.config()

task('getBusinessLogicAddress', 'Deploys business logic contract')
    .addParam('businessId', 'The business ID')
    .addParam('factory', 'The factory contract address')
    .addParam('businessVersion', 'business ID version to retrieve')
    .setAction(async (taskArgs, hre) => {
        const { businessId, factory, businessVersion } = taskArgs

        const signer = getSigner(hre)

        // Call the deploy script and display the result
        const result = await getBusinessLogicAddress(
            businessId,
            factory,
            businessVersion,
            signer
        )

        console.log('BusinessID address:', result)
    })
