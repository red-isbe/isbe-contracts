import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { revokeRole } from '../../../scripts/access/accessControl/revokeRole'

/**
 npx hardhat revokeRole --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

task('revokeRole', 'Grants a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('account', 'The address to grant the role to')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, account, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await revokeRole(role, account, diamond, signer)
        console.log('Revoked role:' + JSON.stringify(result))
    })
