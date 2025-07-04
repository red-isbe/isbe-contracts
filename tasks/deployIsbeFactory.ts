import { task } from 'hardhat/config'
import { deployIsbeFactory } from '../scripts/deployIsbeFactory' // Adjust path if needed

task('deployIsbeFactory', 'Deploys the ISBE Factory contract').setAction(
    async (args, hre) => {
        const accountAddress = process.env.ACCOUNT_ADDRESS ?? ''

        const address = await deployIsbeFactory(hre, accountAddress, '0x')
        console.log('ISBE Factory deployed at:', address)
    }
)
