import {
    UseCaseConfig,
    DeployedUseCase,
    DeployedBusinessLogic,
} from '../types/DeploymentTypes'
import { getBusinessLogicAddress } from '../../../scripts/businessLogic/getBusinessLogicAddress'
import { setConfig } from '../../../scripts/configMgmt/setConfig'
import { getConfig } from '../../../scripts/configMgmt/getConfig'
import { getFacets } from '../../../scripts/configMgmt/getFacets'
import { deployUseCase } from '../../../scripts/proxyFactory/deployUseCase'
import { Signer, ZeroAddress } from 'ethers'

interface BusinessLogicConfig {
    businessId: string
    version: number
}

/**
 * Especializada en el despliegue de casos de uso
 */
export class UseCaseDeployer {
    constructor(
        private hre: import('hardhat/types').HardhatRuntimeEnvironment
    ) {}

    async deployAll(
        configs: UseCaseConfig[],
        factoryAddress: string,
        signer: Signer,
        businessLogics: DeployedBusinessLogic[]
    ): Promise<DeployedUseCase[]> {
        console.log(`🎯 Desplegando ${configs.length} casos de uso...`)

        const results: DeployedUseCase[] = []
        let successCount = 0
        let failCount = 0

        for (const config of configs) {
            try {
                console.log(
                    `\n   🏗️ Desplegando caso de uso: ${config.description}`
                )
                const result = await this.deploySingle(
                    config,
                    factoryAddress,
                    signer,
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
                    `      ❌ Error desplegando ${config.description}:`,
                    deploymentResult.error
                )
            }
        }

        console.log(
            `\n   📊 Resumen de casos de uso: ${successCount} exitosos, ${failCount} fallidos`
        )
        return results
    }

    private async deploySingle(
        config: UseCaseConfig,
        factoryAddress: string,
        signer: Signer,
        businessLogics: DeployedBusinessLogic[]
    ): Promise<DeployedUseCase> {
        try {
            await this.validateRequiredBusinessLogics(
                config,
                businessLogics,
                factoryAddress,
                signer
            )

            const businessLogicConfigs = this.createBusinessLogicConfigs(config)
            console.log(
                `      📋 Configurando ${businessLogicConfigs.length} lógicas de negocio...`
            )

            const configVersion = await this.setupConfiguration(
                config,
                factoryAddress,
                signer
            )
            await this.validateBusinessLogicConfiguration(
                config,
                businessLogicConfigs,
                businessLogics,
                factoryAddress,
                signer,
                configVersion
            )

            console.log(`      ⚙️ Configuración establecida`)

            const proxyAddress = await this.deployProxy(
                config,
                factoryAddress,
                signer
            )
            console.log(`      🎯 Proxy extraído del evento: ${proxyAddress}`)

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
        factoryAddress: string,
        signer: Signer
    ): Promise<number> {
        // Check if this is a secp256r1 network
        const networkConfig = this.hre.config.networks[
            this.hre.network.name
        ] as {
            curve?: string
            secp256r1Accounts?: Array<{ privateKey: string }>
        }

        let configResult: { version: number }

        if (networkConfig.curve === 'secp256r1') {
            console.log('      🔧 Using secp256r1-compatible setConfig...')
            // Use secp256r1-compatible setConfig with raw transactions
            const { setConfigSecp256r1 } = await import(
                '../../../scripts/configMgmt/setConfigSecp256r1'
            )
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
            console.log('      🔧 Using standard setConfig...')
            // Use standard setConfig for secp256k1 networks
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
        signer: Signer,
        configVersion: number
    ): Promise<void> {
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
                `Lógica de negocio ${expected.businessId} no encontrada en la configuración`
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
                `Lógica de negocio ${blConfig.businessId} no configurada como faceta`
            )
        }
    }

    private async deployProxy(
        config: UseCaseConfig,
        factoryAddress: string,
        signer: Signer
    ): Promise<string> {
        console.log(`      🚀 Desplegando proxy...`)

        // Check if this is a secp256r1 network
        const networkConfig = this.hre.config.networks[
            this.hre.network.name
        ] as {
            curve?: string
            secp256r1Accounts?: Array<{ privateKey: string }>
        }

        let useCaseDeployed: { proxy: string }

        if (networkConfig.curve === 'secp256r1') {
            console.log('      🔧 Using secp256r1-compatible deployUseCase...')
            // Use secp256r1-compatible deployUseCase with raw transactions
            const { deployUseCaseSecp256r1 } = await import(
                '../../../scripts/proxyFactory/deployUseCaseSecp256r1'
            )
            useCaseDeployed = await deployUseCaseSecp256r1(
                this.hre,
                config.configurationId,
                1, // versión de configuración
                config.rbacs.map((rbac) => rbac.role),
                config.rbacs.map((rbac) => rbac.members),
                config.initBusinessIds,
                config.initCallData,
                factoryAddress
            )
        } else {
            console.log('      🔧 Using standard deployUseCase...')
            // Use standard deployUseCase for secp256k1 networks
            useCaseDeployed = await deployUseCase(
                config.configurationId,
                1, // versión de configuración
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
        factoryAddress: string,
        signer: Signer
    ): Promise<void> {
        const missingLogics: string[] = []

        for (const requiredKey of config.businessLogicKeys) {
            const isLocallyDeployed = businessLogics.some(
                (bl) => bl.config.key === requiredKey && bl.success
            )

            if (!isLocallyDeployed) {
                const isInFactory = await this.checkBusinessLogicInFactory(
                    requiredKey,
                    factoryAddress,
                    signer
                )
                if (!isInFactory) {
                    missingLogics.push(requiredKey)
                }
            }
        }

        if (missingLogics.length > 0) {
            throw new Error(
                `Lógicas de negocio faltantes: ${missingLogics.join(', ')}`
            )
        }
    }

    private async checkBusinessLogicInFactory(
        businessKey: string,
        factoryAddress: string,
        signer: Signer
    ): Promise<boolean> {
        try {
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
            error instanceof Error ? error.message : 'Error desconocido'
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
                `      ✅ Proxy desplegado en: ${result.proxyAddress}`
            )
        }
        console.log(`      ❌ Error: ${result.error}`)
    }
}
