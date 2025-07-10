import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { setRoleAdmin } from '../../../scripts/access/accessControl/setRoleAdmin'

/**
 npx hardhat setRoleAdmin --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --admin-role "0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('setRoleAdmin', 'Grants a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('adminRole', 'The new admin role')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, adminRole, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await setRoleAdmin(role, adminRole, diamond, signer)
        console.log('Admin role:' + JSON.stringify(result))
    })
