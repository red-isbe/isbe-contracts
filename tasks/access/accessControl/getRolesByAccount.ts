import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getRolesByAccount } from '../../../scripts/access/accessControl/getRolesByAccount'

/**
 npx hardhat getRolesByAccount --network localhost \
  --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --diamond "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
 */

task('getRolesByAccount', 'Grants a role to an account')
    .addParam('account', 'The account address')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { account, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await getRolesByAccount(account, diamond, signer)
        console.log('Roles:' + result.roles)
    })
