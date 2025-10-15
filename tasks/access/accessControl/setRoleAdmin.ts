import { task } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { setRoleAdmin } from '../../../scripts/access/accessControl/setRoleAdmin'

/**
 npx hardhat setRoleAdmin --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --admin-role "0xc4fca0e2ae1ffe7494d7a1a0ee458ac6b6d84e022ad4f87c1742be5599e5e7fb" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('setRoleAdmin', 'Setting a role admin')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('adminRole', 'The new admin role')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, adminRole, diamond } = taskArgs
        console.log('🔐 Initializing signature provider for access control...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        console.log('📋 Revoking role with parameters:')
        console.log(`   Role: ${role}`)
        console.log(`   Admin Role: ${adminRole}`)
        console.log(`   Diamond: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await setRoleAdmin(
            role,
            adminRole,
            diamond,
            signatureProvider
        )

        console.log('\n✅ Role admin set successfully:')
        console.log(`   Admin role: ${result.role}`)
        console.log(`   Previous Adm Role: ${result.previousAdminRole}`)
        console.log(`   New Adm Role: ${result.newAdminRole}`)
        console.log(`   Setf by: ${result.sender}`)
    })
