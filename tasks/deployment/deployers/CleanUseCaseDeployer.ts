import {
    UseCaseConfig,
    DeployedUseCase,
    DeployedBusinessLogic,
} from '../types/DeploymentTypes'
import { ISignatureProvider } from '../providers/ISignatureProvider'
import { getBusinessLogicAddress } from '../../../scripts/businessLogic/getBusinessLogicAddress'
import { setConfig } from '../../../scripts/configMgmt/setConfig'
import { getConfig } from '../../../scripts/configMgmt/getConfig'
import { getFacets } from '../../../scripts/configMgmt/getFacets'
import { deployUseCase } from '../../../scripts/proxyFactory/deployUseCase'
import { ZeroAddress } from 'ethers'

interface BusinessLogicConfig {
    businessId: string
    version: number
}

interface ProgressTracker {
    increment: (success: boolean) => void
}

/**
 * Clean use case deployer using signature provider abstraction
 * No longer needs to know about curve-specific deployment details
 */
export class CleanUseCaseDeployer {
    constructor(
        private hre: import('hardhat/types').HardhatRuntimeEnvironment,
        private signatureProvider: ISignatureProvider
    ) {}

    /**
     * Configure all use cases without deploying them
     * This only registers the configurations using setConfig but doesn't deploy proxies
     */
    async configureAll(
        configs: UseCaseConfig[],
        factoryAddress: string,
        businessLogics: DeployedBusinessLogic[],
        progressTracker?: ProgressTracker
    ): Promise<DeployedUseCase[]> {
        console.log(
            `🔧 Configuring ${configs.length} use cases with ${this.signatureProvider.getCurveType()}...`
        )

        const results: DeployedUseCase[] = []
        let successCount = 0
        let failCount = 0

        for (const config of configs) {
            try {
                console.log(
                    `\n   📝 Configuring use case: ${config.description}`
                )
                console.log(
                    `      📝 Configuration ID: ${config.configurationId}`
                )

                // Validate business logics
                await this.validateRequiredBusinessLogics(
                    config,
                    businessLogics,
                    factoryAddress
                )

                const businessLogicConfigs =
                    this.createBusinessLogicConfigs(config)
                console.log(
                    `      📋 Configuring ${businessLogicConfigs.length} business logics...`
                )

                // Set up configuration only
                const configVersion = await this.setupConfiguration(
                    config,
                    factoryAddress
                )
                await this.validateBusinessLogicConfiguration(
                    config,
                    businessLogicConfigs,
                    businessLogics,
                    factoryAddress,
                    configVersion
                )

                console.log(`      ✅ Configuration successful`)

                // Create a successful result without proxy address
                const result: DeployedUseCase = {
                    config,
                    proxyAddress: null, // No proxy since we're only configuring
                    success: true,
                    error: null,
                }

                results.push(result)
                successCount++

                if (progressTracker?.increment) {
                    progressTracker.increment(true)
                }
            } catch (error) {
                failCount++
                const deploymentResult = this.createFailedDeployment(
                    config,
                    error
                )
                results.push(deploymentResult)
                console.error(
                    `      ❌ Error configuring ${config?.description || 'Unknown Use Case'}:`,
                    deploymentResult.error
                )

                if (progressTracker?.increment) {
                    progressTracker.increment(false)
                }
            }
        }

        console.log(
            `\n   📊 Configuration summary: ${successCount} successful, ${failCount} failed`
        )
        return results
    }

    /**
     * Deploy all use cases including configuration and proxy deployment
     */
    async deployAll(
        configs: UseCaseConfig[],
        factoryAddress: string,
        businessLogics: DeployedBusinessLogic[]
    ): Promise<DeployedUseCase[]> {
        console.log(
            `🎯 Deploying ${configs.length} use cases with ${this.signatureProvider.getCurveType()}...`
        )

        const results: DeployedUseCase[] = []
        let successCount = 0
        let failCount = 0

        for (const config of configs) {
            try {
                console.log(`\n   🏗️ Deploying use case: ${config.description}`)
                console.log(
                    `      📝 Configuration ID: ${config.configurationId}`
                )
                const result = await this.deploySingle(
                    config,
                    factoryAddress,
                    businessLogics
                )

                results.push(result)
                this.logDeploymentResult(result)

                if (result.success) {
                    successCount++
                } else {
                    failCount++
                }
            } catch (error) {
                failCount++
                const deploymentResult = this.createFailedDeployment(
                    config,
                    error
                )
                results.push(deploymentResult)
                console.error(
                    `      ❌ Error deploying ${config?.description || 'Unknown Use Case'}:`,
                    deploymentResult.error
                )
            }
        }

        console.log(
            `\n   📊 Use case summary: ${successCount} successful, ${failCount} failed`
        )
        return results
    }

    private async deploySingle(
        config: UseCaseConfig,
        factoryAddress: string,
        businessLogics: DeployedBusinessLogic[]
    ): Promise<DeployedUseCase> {
        try {
            await this.validateRequiredBusinessLogics(
                config,
                businessLogics,
                factoryAddress
            )

            const businessLogicConfigs = this.createBusinessLogicConfigs(config)
            console.log(
                `      📋 Configuring ${businessLogicConfigs.length} business logics...`
            )

            const configVersion = await this.setupConfiguration(
                config,
                factoryAddress
            )
            await this.validateBusinessLogicConfiguration(
                config,
                businessLogicConfigs,
                businessLogics,
                factoryAddress,
                configVersion
            )

            console.log(`      ⚙️ Configuration established`)

            const proxyAddress = await this.deployProxy(config, factoryAddress)
            console.log(`      🎯 Proxy extracted from event: ${proxyAddress}`)

            return this.createSuccessfulDeployment(config, proxyAddress)
        } catch (error) {
            return this.createFailedDeployment(config, error)
        }
    }

    private createBusinessLogicConfigs(
        config: UseCaseConfig
    ): BusinessLogicConfig[] {
        return config.businessLogicKeys.map((key, index) => ({
            businessId: key,
            version: config.versions[index] || 0,
        }))
    }

    private async setupConfiguration(
        config: UseCaseConfig,
        factoryAddress: string
    ): Promise<number> {
        console.log(
            `      🔧 Using ${this.signatureProvider.getCurveType()} setConfig...`
        )

        let configResult: { version: number }

        if (this.signatureProvider.getCurveType() === 'secp256r1') {
            // Use secp256r1-compatible setConfig
            const { setConfigSecp256r1 } =
                await import('../../../scripts/configMgmt/setConfigSecp256r1')
            configResult = await setConfigSecp256r1(
                this.hre,
                config.configurationId,
                config.businessLogicKeys,
                config.businessLogicKeys.map(
                    (_, index) => config.versions[index] || 0
                ),
                factoryAddress
            )
        } else {
            // Use standard setConfig for secp256k1 networks
            const signer = await this.signatureProvider.getSigner()
            configResult = await setConfig(
                config.configurationId,
                config.businessLogicKeys,
                config.businessLogicKeys.map(
                    (_, index) => config.versions[index] || 0
                ),
                factoryAddress,
                signer
            )
        }

        return configResult.version as number
    }

    private async validateBusinessLogicConfiguration(
        config: UseCaseConfig,
        businessLogicConfigs: BusinessLogicConfig[],
        businessLogics: DeployedBusinessLogic[],
        factoryAddress: string,
        configVersion: number
    ): Promise<void> {
        const signer = await this.signatureProvider.getSigner()
        const configData = await getConfig(
            config.configurationId,
            configVersion,
            factoryAddress,
            signer
        )
        const facetsData = await getFacets(
            config.configurationId,
            configVersion,
            factoryAddress,
            signer
        )

        businessLogicConfigs.forEach((blConfig, index) => {
            this.validateBusinessLogicInConfig(
                blConfig,
                configData.businessData[index]
            )
            this.validateBusinessLogicInFacets(
                blConfig,
                businessLogics,
                facetsData.facets
            )
        })
    }

    private validateBusinessLogicInConfig(
        expected: BusinessLogicConfig,
        actual: { businessId: string; version: number }
    ): void {
        if (
            expected.businessId !== actual.businessId ||
            expected.version !== actual.version
        ) {
            throw new Error(
                `Business logic ${expected.businessId} not found in configuration`
            )
        }
    }

    private validateBusinessLogicInFacets(
        blConfig: BusinessLogicConfig,
        businessLogics: DeployedBusinessLogic[],
        facets: { facetAddress: string }[]
    ): void {
        const deployedLogic = businessLogics.find(
            (dbl) => dbl.config.key === blConfig.businessId
        )
        const facetExists = facets.some(
            (facet) => facet.facetAddress === deployedLogic?.address
        )

        if (!facetExists) {
            throw new Error(
                `Business logic ${blConfig.businessId} not configured as facet`
            )
        }
    }

    private async deployProxy(
        config: UseCaseConfig,
        factoryAddress: string
    ): Promise<string> {
        console.log(`      🚀 Deploying proxy...`)

        let useCaseDeployed: { proxy: string }

        if (this.signatureProvider.getCurveType() === 'secp256r1') {
            // Use secp256r1-compatible deployUseCase
            const { deployUseCaseSecp256r1 } =
                await import('../../../scripts/proxyFactory/deployUseCaseSecp256r1')
            useCaseDeployed = await deployUseCaseSecp256r1(
                this.hre,
                config.configurationId,
                1, // configuration version
                config.rbacs.map((rbac) => rbac.role),
                config.rbacs.map((rbac) => rbac.members),
                config.initBusinessIds,
                config.initCallData,
                factoryAddress
            )
        } else {
            // Use standard deployUseCase for secp256k1 networks
            const signer = await this.signatureProvider.getSigner()
            useCaseDeployed = await deployUseCase(
                config.configurationId,
                1, // configuration version
                config.rbacs.map((rbac) => rbac.role),
                config.rbacs.map((rbac) => rbac.members),
                config.initBusinessIds,
                config.initCallData,
                factoryAddress,
                signer
            )
        }

        return useCaseDeployed.proxy
    }

    private async validateRequiredBusinessLogics(
        config: UseCaseConfig,
        businessLogics: DeployedBusinessLogic[],
        factoryAddress: string
    ): Promise<void> {
        const missingLogics: string[] = []

        for (const requiredKey of config.businessLogicKeys) {
            const isLocallyDeployed = businessLogics.some(
                (bl) => bl.config.key === requiredKey && bl.success
            )

            if (!isLocallyDeployed) {
                const isInFactory = await this.checkBusinessLogicInFactory(
                    requiredKey,
                    factoryAddress
                )
                if (!isInFactory) {
                    missingLogics.push(requiredKey)
                }
            }
        }

        if (missingLogics.length > 0) {
            throw new Error(
                `Missing business logics: ${missingLogics.join(', ')}`
            )
        }
    }

    private async checkBusinessLogicInFactory(
        businessKey: string,
        factoryAddress: string
    ): Promise<boolean> {
        try {
            const signer = await this.signatureProvider.getSigner()
            const businessLogic = await getBusinessLogicAddress(
                businessKey,
                factoryAddress,
                '0',
                signer
            )
            return businessLogic?.businessAddress !== ZeroAddress
        } catch {
            return false
        }
    }

    private createSuccessfulDeployment(
        config: UseCaseConfig,
        proxyAddress: string
    ): DeployedUseCase {
        return {
            config,
            proxyAddress,
            success: true,
            error: null,
        }
    }

    private createFailedDeployment(
        config: UseCaseConfig,
        error: unknown
    ): DeployedUseCase {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
        return {
            config,
            proxyAddress: null,
            success: false,
            error: errorMessage,
        }
    }

    private logDeploymentResult(result: DeployedUseCase): void {
        if (result.success) {
            return console.log(
                `      ✅ Proxy deployed at: ${result.proxyAddress}`
            )
        }
        console.log(`      ❌ Error: ${result.error}`)
    }
}
