import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { grantRole } from '../../../scripts/access/accessControl/grantRole'

/**
 npx hardhat grantRole --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('grantRole', 'Grants a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('account', 'The address to grant the role to')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, account, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await grantRole(role, account, diamond, signer)
        console.log('Granted role:' + JSON.stringify(result))
    })
