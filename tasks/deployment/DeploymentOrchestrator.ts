import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Signer } from 'ethers'
import { DeploymentConfig } from './config/DeploymentConfig'
import { GovernanceDeployer } from './deployers/GovernanceDeployer'
import { BusinessLogicDeployer } from './deployers/BusinessLogicDeployer'
import { UseCaseDeployer } from './deployers/UseCaseDeployer'
import { DeploymentValidator } from './validators/DeploymentValidator'
import { DeploymentResult, DeploymentOptions } from './types/DeploymentTypes'
import { DeploymentTableRenderer } from './utils/DeploymentTableRenderer'

/**
 * Main orchestrator that coordinates the entire deployment process
 */
export class DeploymentOrchestrator {
    private governanceDeployer: GovernanceDeployer
    private businessLogicDeployer: BusinessLogicDeployer
    private useCaseDeployer: UseCaseDeployer
    private validator: DeploymentValidator
    private tableRenderer: DeploymentTableRenderer
    private signer?: Signer

    constructor(
        private hre: HardhatRuntimeEnvironment,
        private config: DeploymentConfig
    ) {
        this.governanceDeployer = new GovernanceDeployer(hre)
        this.businessLogicDeployer = new BusinessLogicDeployer(hre)
        this.useCaseDeployer = new UseCaseDeployer(hre)
        this.validator = new DeploymentValidator(hre)
        this.tableRenderer = new DeploymentTableRenderer()
    }

    async deploy(options: DeploymentOptions = {}): Promise<DeploymentResult> {
        console.log('🏗️ Starting deployment orchestration...')

        const result = this.initializeResult(options)

        try {
            await this.initializeSigner()

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

    private async initializeSigner(): Promise<void> {
        // Check if this is a secp256r1 network and use appropriate signer
        const networkConfig = this.hre.config.networks[
            this.hre.network.name
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any

        if (
            networkConfig.curve === 'secp256r1' &&
            networkConfig.secp256r1Accounts
        ) {
            // Use secp256r1 account from network configuration
            const secp256r1Account = networkConfig.secp256r1Accounts[0]
            const privateKey = secp256r1Account.privateKey.startsWith('0x')
                ? secp256r1Account.privateKey
                : '0x' + secp256r1Account.privateKey

            // Create wallet from private key and connect to provider
            this.signer = new this.hre.ethers.Wallet(
                privateKey,
                this.hre.ethers.provider
            )

            const address = await this.signer.getAddress()
            console.log(`🔐 Using secp256r1 signer: ${address}`)

            // For secp256r1 networks, the governance address (secp256r1-derived) differs from signer address (secp256k1-derived)
            // This is expected and normal - we use secp256k1 signing with secp256r1-derived addresses
            console.log(
                `📍 Governance account configured as: ${this.config.governance.accountAddress}`
            )
            console.log(
                `🔑 Signing with Ethereum-compatible address: ${address}`
            )
        } else {
            // Use standard Hardhat signers for secp256k1 networks
            const signers = await this.hre.ethers.getSigners()
            if (signers.length === 0) {
                throw new Error('No signers available')
            }

            this.signer = signers[0]
            const address = await this.signer.getAddress()
            console.log(`🔐 Using signer: ${address}`)
        }
    }

    private async deployGovernance(result: DeploymentResult): Promise<void> {
        this.logStepStart(1, 'Deploying governance')

        result.governance = await this.governanceDeployer.deploy(
            this.config.governance,
            this.signer!
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

        result.businessLogics = await this.businessLogicDeployer.deployAll(
            this.config.businessLogics,
            result.governance!.address,
            this.signer!
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

        result.useCases = await this.useCaseDeployer.deployAll(
            this.config.useCases,
            result.governance!.address,
            this.signer!,
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
        console.log(`\n${emoji} Step ${stepNumber}: ${description}...`)
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
        console.log('\n📈 FINAL STATISTICS:')
        console.log('========================')
        console.log(
            `⏱️  Total duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`
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
        console.log('\n🎯 DEPLOYED USE CASES:')
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
            console.log('\n❌ FAILED USE CASES:')
            failedUseCases.forEach((useCase, index) => {
                console.log(`   ${index + 1}. ${useCase.config.description}`)
                console.log(`      🚨 Error: ${useCase.error}`)
                console.log(
                    `      🔗 Config ID: ${useCase.config.configurationId}`
                )
            })
        }
    }
}
