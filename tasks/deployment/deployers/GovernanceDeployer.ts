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
        const { deployIsbeFactory } = await import(
            '../../../scripts/businessLogic/deployIsbeFactory'
        )
        const factoryAddress = await deployIsbeFactory(
            this.hre,
            accountAddress,
            config.initData
        )

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
