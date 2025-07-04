import { task } from 'hardhat/config'
import * as dotenv from 'dotenv'
import path from 'path'
import { deployBusinessLogic } from '../scripts/deployBusinessLogic'
import fs from 'fs'

/**
 npx hardhat deployBusinessLogic --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --bytecode-path "./artifacts/contracts/hashtimestamp/HashTimestampFacet.sol/HashTimestampFacet.json"
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
        const bytecodeContent = fs
            .readFileSync(path.resolve(bytecodePath), 'utf8')
            .trim()

        const bytecode = JSON.parse(bytecodeContent).bytecode

        // Call the deploy script and display the result
        const result = await deployBusinessLogic(
            businessId,
            bytecode,
            factory,
            signer
        )

        console.log('Deployment result:', result)
    })
