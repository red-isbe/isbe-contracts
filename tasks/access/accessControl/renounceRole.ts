import { task } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { renounceRole } from '../../../scripts/access/accessControl/renounceRole'

/**
 npx hardhat renounceRole --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('renounceRole', 'Renounce a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, diamond } = taskArgs
        console.log('🔐 Initializing signature provider for access control...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        console.log('📋 Renouncing role with parameters:')
        console.log(`   Role: ${role}`)
        console.log(`   Diamond: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await renounceRole(role, diamond, signatureProvider)

        console.log('\n✅ Role renounced successfully:')
        console.log(`   Role: ${result.role}`)
        console.log(`   Account: ${result.account}`)
        console.log(`   Renounced by: ${result.sender}`)
    })
