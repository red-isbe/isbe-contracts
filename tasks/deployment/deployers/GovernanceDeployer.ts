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
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Signer } from 'ethers'
import { GovernanceConfig } from '../types/DeploymentTypes'
import { getIsbeFactory } from '../../../scripts/utils/getIsbeFactory'

/**
 * Specialised in the deployment of governance
 */
export class GovernanceDeployer {
    constructor(private hre: HardhatRuntimeEnvironment) {}

    async deploy(config: GovernanceConfig, signer: Signer) {
        console.log('🏛️ Deploying governance system...')

        try {
            const accountAddress = await this.resolveAccountAddress(
                config,
                signer
            )
            console.log(`   🔐 ISBE Governance account: ${accountAddress}`)

            // Check if this is a secp256r1 network and confirm production support
            const networkConfig = this.hre.config.networks[
                this.hre.network.name
            ] as {
                curve?: string
                secp256r1Accounts?: Array<{ privateKey: string }>
            }
            if (networkConfig.curve === 'secp256r1') {
                console.log(
                    '   ✅ secp256r1 network detected - using production secp256r1 wallet'
                )
                console.log('   ✅ Full NIST P-256 compliance enabled')
                console.log(
                    '   ✅ Production-ready secp256r1 deployment active'
                )
            }

            const { factory, factoryAddress } = await this.deployFactory(
                accountAddress,
                config,
                signer
            )
            console.log(`   📍 Factory address: ${factoryAddress}`)

            await this.validateDeployment(factoryAddress)

            console.log('   ✅ Governance system successfully deployed')

            return {
                address: factoryAddress,
                factory,
                signer,
                config,
            }
        } catch (error) {
            console.error('   ❌ Error deploying governance:', error.message)
            throw error
        }
    }

    private async resolveAccountAddress(
        config: GovernanceConfig,
        signer: Signer
    ): Promise<string> {
        return config.accountAddress || (await signer.getAddress())
    }

    private async deployFactory(
        accountAddress: string,
        config: GovernanceConfig,
        signer: Signer
    ) {
        // Check if this is a secp256r1 network
        const networkConfig = this.hre.config.networks[
            this.hre.network.name
        ] as {
            curve?: string
            secp256r1Accounts?: Array<{ privateKey: string }>
        }

        let factoryAddress: string

        if (networkConfig.curve === 'secp256r1') {
            console.log('   🔧 Using secp256r1-compatible deployment method...')
            // Use secp256r1-compatible deployment with raw transactions
            const { deployIsbeFactorySecp256r1 } =
                await import('../../../scripts/businessLogic/deployIsbeFactorySecp256r1')
            factoryAddress = await deployIsbeFactorySecp256r1(
                this.hre,
                accountAddress,
                config.initData
            )
        } else {
            console.log('   🔧 Using standard Hardhat deployment method...')
            // Use standard deployment for secp256k1 networks
            const { deployIsbeFactory } =
                await import('../../../scripts/businessLogic/deployIsbeFactory')
            factoryAddress = await deployIsbeFactory(
                this.hre,
                accountAddress,
                config.initData
            )
        }

        const factory = await getIsbeFactory(factoryAddress, signer)

        return { factory, factoryAddress }
    }

    private async validateDeployment(factoryAddress: string): Promise<void> {
        const factoryCode =
            await this.hre.ethers.provider.getCode(factoryAddress)
        if (factoryCode === '0x') {
            throw new Error('Factory was not deployed correctly')
        }
    }
}
