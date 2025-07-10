import { task } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getRoleMembersCount } from '../../../scripts/access/accessControl/getRoleMembersCount'

/**
 npx hardhat getRoleMembersCount --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getRoleMembersCount', 'Grants a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await getRoleMembersCount(role, diamond, signer)
        console.log('Role members count:' + result.memberCount)
    })
