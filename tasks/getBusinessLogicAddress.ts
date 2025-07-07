import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import { getBusinessLogicAddress } from '../scripts/businessLogic/getBusinessLogicAddress'

/**
 npx hardhat getBusinessLogicAddress --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --business-version "1"
 */

dotenv.config()

task('getBusinessLogicAddress', 'Deploys business logic contract')
    .addParam('businessId', 'The business ID')
    .addParam('factory', 'The factory contract address')
    .addParam('businessVersion', 'business ID version to retrieve')
    .setAction(async (taskArgs, hre) => {
        const { businessId, factory, businessVersion } = taskArgs
        const privateKey = process.env.ACCOUNT_PRIVATE_KEY

        if (!privateKey) {
            throw new Error('ACCOUNT_PRIVATE_KEY not set in .env')
        }

        // Create a signer using the private key and Hardhat's ethers provider
        const signer = new hre.ethers.Wallet(privateKey, hre.ethers.provider)

        // Call the deploy script and display the result
        const result = await getBusinessLogicAddress(
            businessId,
            factory,
            businessVersion,
            signer
        )

        console.log('BusinessID address:', result)
    })
