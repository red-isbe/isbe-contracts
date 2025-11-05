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
import {
    EnhancedLogger,
    DeploymentTimer,
    DeploymentProgressTracker,
    LogConfig,
    LogLevel,
} from './utils/LoggingEnhancements'

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
    private timer: DeploymentTimer

    constructor(
        private hre: HardhatRuntimeEnvironment,
        private config: DeploymentConfig
    ) {
        // Create appropriate signature provider for the network
        this.signatureProvider = SignatureProviderFactory.create(hre)
        this.timer = new DeploymentTimer()

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

        EnhancedLogger.log(
            LogLevel.NORMAL,
            `📋 Clean deployment orchestrator initialized`
        )
    }

    async deploy(options: DeploymentOptions = {}): Promise<DeploymentResult> {
        const address = await this.signatureProvider.getAddress()
        const curveType = this.signatureProvider.getCurveType()

        // Log deployment configuration once at the start
        EnhancedLogger.logNetworkInfo(this.hre.network.name, curveType, address)

        const totalBusinessLogics = this.config.businessLogics.length
        const totalUseCases = this.config.useCases.length

        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            console.log(`\n📋 DEPLOYMENT OVERVIEW:`)
            console.log(
                `   • Business logics to deploy: ${totalBusinessLogics}`
            )
            console.log(`   • Use cases to deploy: ${totalUseCases}`)
        }

        EnhancedLogger.logSection(
            'Starting Clean Deployment',
            'Using SignatureProvider pattern'
        )
        this.timer.startStep('Total Deployment')

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

        // Only log if verbose - already shown in network info
        EnhancedLogger.log(
            LogLevel.VERBOSE,
            `🔐 Signature provider initialized: ${address}`
        )

        // Update governance address to use provider's address
        this.config.governance.accountAddress = address
    }

    private async deployGovernance(result: DeploymentResult): Promise<void> {
        EnhancedLogger.logSection('Step 1: Governance Deployment')
        this.timer.startStep('Governance Deployment')

        result.governance = await this.governanceDeployer.deploy(
            this.config.governance
        )
        result.summary.completedSteps++

        this.timer.endStep()
        console.log(
            `✅ Governance system deployed at: ${result.governance.address}`
        )
    }

    private async deployBusinessLogics(
        result: DeploymentResult,
        options: DeploymentOptions
    ): Promise<void> {
        if (options.skipBusinessLogics) return

        EnhancedLogger.logSection('Step 2: Business Logic Deployment')
        this.timer.startStep('Business Logic Deployment')

        const progressTracker = new DeploymentProgressTracker(
            'Business Logics',
            this.config.businessLogics.length
        )

        // Use clean business logic deployer with progress tracking
        result.businessLogics = await this.businessLogicDeployer.deployAll(
            this.config.businessLogics,
            result.governance!.address,
            progressTracker
        )
        result.summary.completedSteps++

        this.timer.endStep()
        progressTracker.printSummary()
    }

    private async deployUseCases(
        result: DeploymentResult,
        options: DeploymentOptions
    ): Promise<void> {
        EnhancedLogger.logSection('Step 3: Use Case Deployment')
        this.timer.startStep('Use Case Deployment')

        const progressTracker = new DeploymentProgressTracker(
            'Use Cases',
            this.config.useCases.length
        )

        if (options.skipUseCases) {
            // Only register configurations but don't deploy use cases
            console.log(
                '\n🔧 Registering configurations without deploying use cases'
            )
            console.log('   ℹ️  Will call setConfig but skip deployUseCase')

            // Configure use cases but don't deploy them
            result.useCases = await this.useCaseDeployer.configureAll(
                this.config.useCases,
                result.governance!.address,
                result.businessLogics,
                progressTracker
            )
        } else {
            // Do full deployment including configuration and proxy creation
            result.useCases = await this.useCaseDeployer.deployAll(
                this.config.useCases,
                result.governance!.address,
                result.businessLogics,
                progressTracker
            )
        }

        result.summary.completedSteps++
        this.timer.endStep()
        progressTracker.printSummary()
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
        if (!LogConfig.isLevel(LogLevel.NORMAL)) return

        const duration = this.timer.getTotalTime()
        const curveType = this.signatureProvider.getCurveType()

        console.log('\\n📈 DEPLOYMENT SUMMARY:')
        console.log('========================')
        console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`)
        console.log(`🔐 Curve: ${curveType}`)
        console.log(`🎯 Network: ${this.hre.network.name}`)

        // Consolidated statistics
        const stats = this.getDeploymentStats(result)
        if (stats.businessLogics.total > 0) {
            const icon = stats.businessLogics.failed === 0 ? '✅' : '⚠️ '
            console.log(
                `${icon} Business Logics: ${stats.businessLogics.successful}/${stats.businessLogics.total}`
            )
        }

        if (stats.useCases.total > 0) {
            const icon = stats.useCases.failed === 0 ? '✅' : '⚠️ '
            console.log(
                `${icon} Use Cases: ${stats.useCases.successful}/${stats.useCases.total}`
            )
        }

        if (result.validationResults.length > 0) {
            const passed = result.validationResults.filter(
                (v) => v.success
            ).length
            const icon =
                passed === result.validationResults.length ? '✅' : '⚠️ '
            console.log(
                `${icon} Validations: ${passed}/${result.validationResults.length}`
            )
        }
    }

    private getDeploymentStats(result: DeploymentResult) {
        return {
            businessLogics: {
                total: result.businessLogics.length,
                successful: result.businessLogics.filter((bl) => bl.success)
                    .length,
                failed: result.businessLogics.filter((bl) => !bl.success)
                    .length,
            },
            useCases: {
                total: result.useCases.length,
                successful: result.useCases.filter((uc) => uc.success).length,
                failed: result.useCases.filter((uc) => !uc.success).length,
            },
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
                console.log(
                    `   ${index + 1}. ${useCase.config?.description || 'Unknown Use Case'} (ID: ${useCase.config?.configurationId || 'N/A'})`
                )
                console.log(`      🚨 Error: ${useCase.error}`)
                console.log(
                    `      🔗 Config ID: ${useCase.config?.configurationId || 'N/A'}`
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
