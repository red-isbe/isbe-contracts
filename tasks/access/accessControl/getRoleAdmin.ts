import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getRoleAdmin } from '../../../scripts/access/accessControl/getRoleAdmin'

/**
 npx hardhat getRoleAdmin --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

task('getRoleAdmin', 'Grants a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await getRoleAdmin(role, diamond, signer)
        console.log('Role admin:' + result.roleAdmin)
    })
