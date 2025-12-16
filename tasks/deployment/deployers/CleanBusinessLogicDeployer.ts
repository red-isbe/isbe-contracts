import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    BusinessLogicConfig,
    DeployedBusinessLogic,
} from '../types/DeploymentTypes'
import { BytecodeExtractor } from '../utils/BytecodeExtractor'
import { ISignatureProvider } from '../providers/ISignatureProvider'
import { deployBusinessLogic } from '../../../scripts/businessLogic/deployBusinessLogic'
import { getBusinessLogicAddress } from '../../../scripts/businessLogic/getBusinessLogicAddress'
import { getBusinessLogics } from '../../../scripts/businessLogic/getBusinessLogics'
import { getBusinessLogicVersions } from '../../../scripts/businessLogic/getBusinessLogicVersions'
import { ZeroAddress } from 'ethers'
import { ProviderError } from 'hardhat/internal/core/providers/errors'

/**
 * Clean business logic deployer using signature provider abstraction
 * No longer needs to know about curve-specific deployment details
 */
export class CleanBusinessLogicDeployer {
    private bytecodeExtractor: BytecodeExtractor

    constructor(
        private hre: HardhatRuntimeEnvironment,
        private signatureProvider: ISignatureProvider
    ) {
        this.bytecodeExtractor = new BytecodeExtractor(hre)
    }

    async deployAll(
        configs: BusinessLogicConfig[],
        factoryAddress: string
    ): Promise<DeployedBusinessLogic[]> {
        console.log(
            `📦 Deploying ${configs.length} business logics with ${this.signatureProvider.getCurveType()}...`
        )
        const results: DeployedBusinessLogic[] = []
        let successCount = 0
        let failCount = 0

        for (const config of configs) {
            try {
                console.log(`\n   🔧 Deploying: ${config.description}`)
                const result = await this.deploySingle(config, factoryAddress)
                results.push(result)

                this.logDeploymentResult(result)

                if (result.success) {
                    successCount++
                } else {
                    failCount++
                }
            } catch (error) {
                failCount++
                const errorMessage = this.extractErrorMessage(error)
                console.error(
                    `      ❌ Error deploying ${config.description}:`,
                    errorMessage
                )
                results.push(this.createErrorResult(config, errorMessage))
            }
        }

        console.log(
            `\n   📊 Summary: ${successCount} successful, ${failCount} failed`
        )
        return results
    }

    private async deploySingle(
        config: BusinessLogicConfig,
        factoryAddress: string
    ): Promise<DeployedBusinessLogic> {
        try {
            // Check if it already exists
            const existingResult = await this.handleExistingBusinessLogic(
                config,
                factoryAddress
            )
            if (existingResult) {
                return existingResult
            }

            // Perform a new deployment
            return await this.performDeployment(config, factoryAddress)
        } catch (error) {
            const errorMessage = this.extractErrorMessage(error)
            return this.createErrorResult(config, errorMessage)
        }
    }

    private async handleExistingBusinessLogic(
        config: BusinessLogicConfig,
        factoryAddress: string
    ): Promise<DeployedBusinessLogic | null> {
        try {
            const signer = await this.signatureProvider.getSigner()
            const businessLogicAddress = await getBusinessLogicAddress(
                config.key,
                factoryAddress,
                '0',
                signer
            )

            if (businessLogicAddress?.businessAddress === ZeroAddress)
                return null
            console.log(
                `      ℹ️  Already exists, reusing: ${businessLogicAddress.businessAddress}`
            )
            return {
                config,
                address: businessLogicAddress.businessAddress,
                success: true,
                error: null,
            }
        } catch {
            // If it doesn't exist or there's an error querying, continue with deployment
            return null
        }
    }

    private async performDeployment(
        config: BusinessLogicConfig,
        factoryAddress: string
    ): Promise<DeployedBusinessLogic> {
        // Extract bytecode from an artefact
        const bytecode = this.bytecodeExtractor.extractFromArtifact(
            config.contractName,
            config.artifactPath
        )

        console.log(
            `      🔧 Using ${this.signatureProvider.getCurveType()} deployment...`
        )

        let businessLogic: {
            businessAddress: string
            businessId: string
            version: string
        }

        if (this.signatureProvider.getCurveType() === 'secp256r1') {
            // Use secp256r1-compatible deployment
            const { deployBusinessLogicSecp256r1 } =
                await import('../../../scripts/businessLogic/deployBusinessLogicSecp256r1')
            businessLogic = await deployBusinessLogicSecp256r1(
                this.hre,
                config.key,
                bytecode,
                factoryAddress
            )
        } else {
            // Use standard deployment for secp256k1 networks
            businessLogic = await deployBusinessLogic(
                config.key,
                bytecode,
                factoryAddress,
                this.signatureProvider
            )
        }

        // Validate deployment using signer
        const signer = await this.signatureProvider.getSigner()
        const businessLogics = await getBusinessLogics(factoryAddress, signer)
        const businessLogicVersions = await getBusinessLogicVersions(
            config.key,
            factoryAddress,
            signer
        )

        if (
            !businessLogics.businessId.includes(config.key) ||
            !businessLogicVersions.businessIdVersions.includes(
                businessLogic.businessAddress
            )
        ) {
            throw new Error(
                `Business logic ${config.key} does not exist after deployment`
            )
        }

        return {
            config,
            address: businessLogic.businessAddress,
            success: true,
            error: null,
        }
    }

    private logDeploymentResult(result: DeployedBusinessLogic): void {
        if (result.success) {
            console.log(`      ✅ Deployed at: ${result.address}`)
        } else {
            console.log(`      ❌ Error: ${result.error}`)
        }
    }

    private createErrorResult(
        config: BusinessLogicConfig,
        errorMessage: string
    ): DeployedBusinessLogic {
        return {
            config,
            address: null,
            success: false,
            error: errorMessage,
        }
    }

    private extractErrorMessage(error: unknown): string {
        return error instanceof ProviderError
            ? `${error.message} - ${error.data}`
            : error instanceof Error
              ? error.message
              : 'Unknown error'
    }
}
