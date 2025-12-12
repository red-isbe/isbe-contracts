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
import { task, types } from 'hardhat/config'

import { deployUseCase } from '../../scripts/proxyFactory/deployUseCase'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { ISignatureProvider } from '../deployment/providers/ISignatureProvider'
import { NetworkConfigWithCurve } from '../../types/hardhat'

/**
 npx hardhat deployUseCase --network localhost \
  --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
  --config-version 1 \
  --rbac-roles '["0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1"]' \
  --rbac-members '[["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]]' \
  --init-business-id "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --init-data "0x" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('deployUseCase', 'Sets config')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The configuration version')
    .addParam('rbacRoles', 'The initialial RBAC roles', undefined, types.json)
    .addParam(
        'rbacMembers',
        'The initialial RBAC members',
        undefined,
        types.json
    )
    .addParam(
        'initBusinessId',
        'The initialization business ids',
        undefined,
        types.json
    )
    .addParam('initData', 'The initialization data', undefined, types.json)
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                configVersion: number
                rbacRoles: string[]
                rbacMembers: string[][]
                initBusinessId: string[]
                initData: string[]
                factory: string
            },
            hre
        ) => {
            const {
                configId,
                configVersion,
                rbacRoles,
                rbacMembers,
                initBusinessId,
                initData,
                factory,
            } = taskArgs

            console.log(`🔍 Network: ${hre.network.name}`)

            // Check if we're on a secp256r1 network
            const networkConfig = hre.config.networks[
                hre.network.name
            ] as NetworkConfigWithCurve
            const isSecp256r1 = networkConfig.curve === 'secp256r1'

            if (isSecp256r1) {
                console.log(
                    '✅ secp256r1 network detected - using enhanced validation'
                )
            }

            try {
                const signatureProvider: ISignatureProvider =
                    SignatureProviderFactory.create(hre)

                const result = await deployUseCase(
                    configId,
                    configVersion,
                    rbacRoles,
                    rbacMembers,
                    initBusinessId,
                    initData,
                    factory,
                    signatureProvider
                )

                console.log('✅ Use case deployed successfully')
                console.log('Deployed Use Case result:')
                console.log('    Configuration ID:', result.configurationId)
                console.log('    Version:', result.version)
                console.log('    RBACs:', JSON.stringify(result.rbacs))
                console.log('    Proxy Address:', result.proxy)
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)
                // Enhanced error handling for secp256r1
                if (
                    isSecp256r1 &&
                    errorMessage.includes('Cannot find square root')
                ) {
                    console.error(
                        '🚨 CRITICAL: secp256r1 signature generation failed'
                    )
                    console.error(
                        '   This indicates the Besu client may not support secp256r1 properly'
                    )
                    console.error('   Required Actions:')
                    console.error(
                        '   1. Check Besu client version and secp256r1 support'
                    )
                    console.error('   2. Verify network configuration')
                    console.error('   3. Test basic secp256r1 operations with:')
                    console.error(
                        '      npx hardhat quick-secp256r1-check --network customR1Network'
                    )
                    process.exit(1)
                }

                throw error
            }
        }
    )
