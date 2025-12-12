/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { task } from 'hardhat/config'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'
import { revokeRole } from '../../../scripts/access/accessControl/revokeRole'

/**
 npx hardhat revokeRole --network localhost \
  --role "0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1" \
  --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('revokeRole', 'Revoke a role to an account')
    .addParam('role', 'The role identifier (bytes32)')
    .addParam('account', 'The address to grant the role to')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { role, account, diamond } = taskArgs
        console.log('🔐 Initializing signature provider for access control...')
        const signatureProvider = SignatureProviderFactory.create(hre)

        console.log('📋 Revoking role with parameters:')
        console.log(`   Role: ${role}`)
        console.log(`   Account: ${account}`)
        console.log(`   Diamond: ${diamond}`)
        console.log(`   Network: ${hre.network.name}`)
        console.log(`   Curve: ${signatureProvider.getCurveType()}`)

        const result = await revokeRole(
            role,
            account,
            diamond,
            signatureProvider
        )

        console.log('\n✅ Role revoked successfully:')
        console.log(`   Role: ${result.role}`)
        console.log(`   Account: ${result.account}`)
        console.log(`   Revoked by: ${result.sender}`)
    })
