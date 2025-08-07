import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getRolesByAccountCount } from '../../../scripts/access/accessControl/getRolesByAccountCount'

/**
 npx hardhat getRolesByAccountCount --network localhost \
  --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getRolesByAccountCount', 'Grants a role to an account')
    .addParam('account', 'The account address')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { account, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await getRolesByAccountCount(account, diamond, signer)
        console.log('Roles count:' + result.rolesCount)
    })
