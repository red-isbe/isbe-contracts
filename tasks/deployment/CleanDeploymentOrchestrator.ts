import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeploymentConfig } from './config/DeploymentConfig'
import { DeploymentResult, DeploymentOptions } from './types/DeploymentTypes'
import { ISignatureProvider } from './providers/ISignatureProvider'
import { SignatureProviderFactory } from './providers/SignatureProviderFactory'
import { CleanGovernanceDeployer } from './deployers/CleanGovernanceDeployer'
import { CleanBusinessLogicDeployer } from './deployers/CleanBusinessLogicDeployer'
import { CleanUseCaseDeployer } from './deployers/CleanUseCaseDeployer'
import { DeploymentValidator } from './validators/DeploymentValidator'
import { DeploymentTableRenderer } from './utils/DeploymentTableRenderer'

/**
 * Clean deployment orchestrator that uses signature provider abstraction
 * Separates curve-specific concerns from business logic
 */
export class CleanDeploymentOrchestrator {
    private signatureProvider: ISignatureProvider
    private governanceDeployer: CleanGovernanceDeployer
    private businessLogicDeployer: CleanBusinessLogicDeployer
    private useCaseDeployer: CleanUseCaseDeployer
    private validator: DeploymentValidator
    private tableRenderer: DeploymentTableRenderer

    constructor(
        private hre: HardhatRuntimeEnvironment,
        private config: DeploymentConfig
    ) {
        // Create appropriate signature provider for the network
        this.signatureProvider = SignatureProviderFactory.create(hre)

        // Initialize deployers with the signature provider
        this.governanceDeployer = new CleanGovernanceDeployer(
            hre,
            this.signatureProvider
        )
        this.businessLogicDeployer = new CleanBusinessLogicDeployer(
            hre,
            this.signatureProvider
        )
        this.useCaseDeployer = new CleanUseCaseDeployer(
            hre,
            this.signatureProvider
        )
        this.validator = new DeploymentValidator(hre)
        this.tableRenderer = new DeploymentTableRenderer()

        console.log(
            `✅ Clean orchestrator initialized with ${this.signatureProvider.getCurveType()} provider`
        )
    }

    async deploy(options: DeploymentOptions = {}): Promise<DeploymentResult> {
        console.log('🏗️ Starting clean curve-aware deployment...')

        const result = this.initializeResult(options)

        try {
            await this.initializeProvider()
            await this.deployGovernance(result)
            await this.deployBusinessLogics(result, options)
            await this.deployUseCases(result, options)
            await this.runValidations(result, options)

            this.completeSuccessfulDeployment(result)
            return result
        } catch (error) {
            this.handleDeploymentError(result, error)
            throw error
        }
    }

    private initializeResult(options: DeploymentOptions): DeploymentResult {
        return {
            governance: null,
            businessLogics: [],
            useCases: [],
            validationResults: [],
            summary: {
                totalSteps: this.calculateTotalSteps(options),
                completedSteps: 0,
                startTime: new Date(),
                endTime: null,
                success: false,
            },
        }
    }

    private async initializeProvider(): Promise<void> {
        const address = await this.signatureProvider.getAddress()
        const curve = this.signatureProvider.getCurveType()

        console.log(`🔐 Signature provider ready:`)
        console.log(`   • Address: ${address}`)
        console.log(`   • Curve: ${curve}`)
        console.log(`   • Network: ${this.hre.network.name}`)

        // Update governance address to use provider's address
        this.config.governance.accountAddress = address
    }

    private async deployGovernance(result: DeploymentResult): Promise<void> {
        this.logStepStart(1, 'Deploying governance')

        result.governance = await this.governanceDeployer.deploy(
            this.config.governance,
            this.signatureProvider
        )
        result.summary.completedSteps++

        console.log(
            `   ✅ Governance deployed at: ${result.governance.address}`
        )
    }

    private async deployBusinessLogics(
        result: DeploymentResult,
        options: DeploymentOptions
    ): Promise<void> {
        if (options.skipBusinessLogics) return

        this.logStepStart(2, 'Deploying business logics')

        // Use clean business logic deployer (no signer needed)
        result.businessLogics = await this.businessLogicDeployer.deployAll(
            this.config.businessLogics,
            result.governance!.address
        )
        result.summary.completedSteps++

        const successfulCount = result.businessLogics.filter(
            (bl) => bl.success
        ).length
        console.log(
            `   ✅ ${successfulCount}/${result.businessLogics.length} business logics deployed`
        )
    }

    private async deployUseCases(
        result: DeploymentResult,
        options: DeploymentOptions
    ): Promise<void> {
        if (options.skipUseCases) return

        this.logStepStart(3, 'Deploying use cases')

        // Use clean use case deployer (no signer needed)
        result.useCases = await this.useCaseDeployer.deployAll(
            this.config.useCases,
            result.governance!.address,
            result.businessLogics
        )
        result.summary.completedSteps++

        const successfulUseCases = result.useCases.filter(
            (uc) => uc.success
        ).length
        console.log(
            `   ✅ ${successfulUseCases}/${result.useCases.length} use cases deployed`
        )
    }

    private async runValidations(
        result: DeploymentResult,
        options: DeploymentOptions
    ): Promise<void> {
        if (options.skipTests) return

        this.logStepStart(4, 'Running validations')

        result.validationResults =
            await this.validator.validateDeployment(result)
        result.summary.completedSteps++

        console.log(`   ✅ Validations completed`)
    }

    private logStepStart(stepNumber: number, description: string): void {
        const stepEmojis = ['📋', '🔧', '🎯', '🔍']
        const emoji = stepEmojis[stepNumber - 1] || '⚙️'
        console.log(`\\n${emoji} Step ${stepNumber}: ${description}...`)
    }

    private completeSuccessfulDeployment(result: DeploymentResult): void {
        result.summary.endTime = new Date()
        result.summary.success = true

        this.displayFinalStats(result)
        this.displayUseCasesTable(result)
    }

    private handleDeploymentError(
        result: DeploymentResult,
        error: unknown
    ): void {
        result.summary.endTime = new Date()
        result.summary.success = false

        const errorMessage =
            error instanceof Error ? error.message : String(error)
        console.error(
            `❌ Error in step ${result.summary.completedSteps + 1}: ${errorMessage}`
        )
    }

    private calculateTotalSteps(options: DeploymentOptions): number {
        let steps = 1 // We always deploy governance
        if (!options.skipBusinessLogics) steps++
        if (!options.skipUseCases) steps++
        if (!options.skipTests) steps++
        return steps
    }

    private displayFinalStats(result: DeploymentResult): void {
        const duration =
            result.summary.endTime!.getTime() -
            result.summary.startTime.getTime()

        console.log('\\n📈 CLEAN DEPLOYMENT STATISTICS:')
        console.log('================================')
        console.log(
            `⏱️  Total duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`
        )
        console.log(
            `🔐 Signature curve: ${this.signatureProvider.getCurveType()}`
        )
        console.log(
            `📊 Completed steps: ${result.summary.completedSteps}/${result.summary.totalSteps}`
        )

        if (result.businessLogics.length > 0) {
            const successful = result.businessLogics.filter(
                (bl) => bl.success
            ).length
            const failed = result.businessLogics.filter(
                (bl) => !bl.success
            ).length
            console.log(
                `🔧 Business logics: ${successful} successful, ${failed} failed`
            )
        }

        if (result.useCases.length > 0) {
            const successful = result.useCases.filter((uc) => uc.success).length
            const failed = result.useCases.filter((uc) => !uc.success).length
            console.log(
                `🎯 Use cases: ${successful} successful, ${failed} failed`
            )
        }

        if (result.validationResults.length > 0) {
            console.log(
                `🔍 Validations executed: ${result.validationResults.length}`
            )
        }
    }

    private displayUseCasesTable(result: DeploymentResult): void {
        console.log('\\n🎯 DEPLOYED USE CASES:')
        console.log('============================')
        if (result.useCases.length === 0) {
            console.log('   ℹ️  No use cases were deployed')
            return
        }

        // Display table using the renderer
        this.tableRenderer.renderUseCasesTable(result.useCases)

        // Display failed cases if any
        const failedUseCases = result.useCases.filter((uc) => !uc.success)
        if (failedUseCases.length > 0) {
            console.log('\\n❌ FAILED USE CASES:')
            failedUseCases.forEach((useCase, index) => {
                console.log(`   ${index + 1}. ${useCase.config.description}`)
                console.log(`      🚨 Error: ${useCase.error}`)
                console.log(
                    `      🔗 Config ID: ${useCase.config.configurationId}`
                )
            })
        }
    }

    /**
     * Get information about the signature provider for debugging
     */
    getProviderInfo(): {
        curve: string
        address?: string
        networkName: string
    } {
        return {
            curve: this.signatureProvider.getCurveType(),
            networkName: this.hre.network.name,
        }
    }
}
