import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import path from 'path'
import { deployBusinessLogic } from '../scripts/deployBusinessLogic'
import fs from 'fs'

/**
 npx hardhat deployBusinessLogic --network localhost \
  --business-id "123" \
  --factory "0xFactoryAddressHere" \
  --bytecode-path "./artifacts/contracts/Logic.sol/Logic.json"
 */

dotenv.config()

task('deployBusinessLogic', 'Deploys business logic contract')
    .addParam('businessId', 'The business ID')
    .addParam('factory', 'The factory contract address')
    .addParam('bytecodePath', 'Path to the business logic bytecode')
    .setAction(async (taskArgs, hre) => {
        const { businessId, factory, bytecodePath } = taskArgs
        const privateKey = process.env.ACCOUNT_PRIVATE_KEY

        if (!privateKey) {
            throw new Error('ACCOUNT_PRIVATE_KEY not set in .env')
        }

        // Create a signer using the private key and Hardhat's ethers provider
        const signer = new hre.ethers.Wallet(privateKey, hre.ethers.provider)

        // retrieves the bytecode from the bytecodePath
        const bytecode = fs
            .readFileSync(path.resolve(bytecodePath), 'utf8')
            .trim()

        // Call the deploy script and display the result
        const result = await deployBusinessLogic(
            businessId,
            bytecode,
            factory,
            signer
        )

        console.log('Deployment result:', result)
    })
