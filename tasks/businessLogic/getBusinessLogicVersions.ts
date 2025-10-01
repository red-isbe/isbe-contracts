import { task } from 'hardhat/config'

import { getBusinessLogicVersions } from '../../scripts/businessLogic/getBusinessLogicVersions'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getBusinessLogicVersions --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getBusinessLogicVersions', 'Deploys business logic contract')
    .addParam('businessId', 'The business ID')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { businessId, factory } = taskArgs

        const signer = await getSigner(hre)

        const result = await getBusinessLogicVersions(
            businessId,
            factory,
            signer
        )

        console.log('BusinessID versions:', result)
    })
