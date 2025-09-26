import { task } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
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

        console.log('🔐 Initializing signature provider for access control...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        console.log('📋 Granting role with parameters:')
        console.log(`   Role: ${role}`)
        console.log(`   Account: ${account}`)
        console.log(`   Diamond: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await grantRole(
            role,
            account,
            diamond,
            signatureProvider
        )

        console.log('\n✅ Role granted successfully:')
        console.log(`   Role: ${result.role}`)
        console.log(`   Account: ${result.account}`)
        console.log(`   Granted by: ${result.sender}`)
    })
