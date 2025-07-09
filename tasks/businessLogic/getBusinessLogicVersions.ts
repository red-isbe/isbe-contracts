import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getBusinessLogicVersions } from '../../scripts/businessLogic/getBusinessLogicVersions'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getBusinessLogicVersions --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --factory "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

dotenv.config()

task('getBusinessLogicVersions', 'Deploys business logic contract')
    .addParam('businessId', 'The business ID')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { businessId, factory } = taskArgs

        const signer = getSigner(hre)

        const result = await getBusinessLogicVersions(
            businessId,
            factory,
            signer
        )

        console.log('BusinessID versions:', result)
    })
