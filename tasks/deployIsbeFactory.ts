import { task } from 'hardhat/config'
import { deployIsbeFactory } from '../scripts/businessLogic/deployIsbeFactory' // Adjust path if needed

/**
 npx hardhat deployIsbeFactory --network localhost
 */

task('deployIsbeFactory', 'Deploys the ISBE Factory contract').setAction(
    async (args, hre) => {
        const accountAddress = process.env.ACCOUNT_ADDRESS ?? ''

        const address = await deployIsbeFactory(hre, accountAddress, '0x')
        console.log('ISBE Factory deployed at:', address)
    }
)
