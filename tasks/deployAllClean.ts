import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { CleanDeploymentOrchestrator } from './deployment/CleanDeploymentOrchestrator'
import { DeploymentOrchestrator } from './deployment/DeploymentOrchestrator'
import { DeploymentConfig } from './deployment/config/DeploymentConfig'
import { DeploymentResult } from './deployment/types/DeploymentTypes'
import { logNetworkInfo } from '../utils/networkUtils'
import { PreCommitValidator } from './validation/PreCommitValidator'
import { SignatureProviderFactory } from './deployment/providers/SignatureProviderFactory'
import {
    LogConfig,
    LogLevel,
    EnhancedLogger,
} from './deployment/utils/LoggingEnhancements'

interface TaskArgs {
    precommit?: boolean
    info?: boolean
    legacy?: boolean
    logLevel?: string
    noDeployUseCases?: boolean
    configFile?: string
}

/**
 * Clean curve-aware deployment task using signature provider abstraction
 *
 * Examples:
 *   npx hardhat deployAllClean --network customR1Network --log-level minimal
 *   npx hardhat deployAllClean --info --log-level verbose
 *   npx hardhat deployAllClean --legacy --log-level debug
 *   LOG_LEVEL=minimal npx hardhat deployAllClean --network customR1Network
 */
task(
    'deployAllClean',
    'Deploys system using clean signature provider architecture'
)
    .addFlag('precommit', 'Run pre-commit validations after deployment')
    .addFlag('info', 'Show detailed network and signature provider information')
    .addFlag(
        'legacy',
        'Use legacy DeploymentOrchestrator for backwards compatibility'
    )
    .addOptionalParam(
        'logLevel',
        'Set logging verbosity: minimal, normal, verbose, debug',
        'normal'
    )
    .addFlag(
        'noDeployUseCases',
        'Register configurations with setConfig but skip actual deployUseCase deployment (cannot be used with --precommit)'
    )
    .addOptionalParam(
        'configFile',
        'JSON configuration file for selective deployment (e.g., selective-deployment.json)',
        undefined
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        // Validate flags - precommit and noDeployUseCases cannot be used together
        if (taskArgs.precommit && taskArgs.noDeployUseCases) {
            throw new Error(
                'The --precommit and --noDeployUseCases flags cannot be used together. Pre-commit validation requires use cases to be deployed.'
            )
        }
        // Configure logging level
        const logLevel = parseLogLevel(taskArgs.logLevel)
        LogConfig.setLevel(logLevel)

        EnhancedLogger.log(
            LogLevel.MINIMAL,
            '🚀 Starting clean curve-aware deployment...'
        )

        // Display network information (reduced in minimal mode)
        if (LogConfig.isLevel(LogLevel.NORMAL)) {
            logNetworkInfo(hre)
        }

        // Display signature provider information
        if (taskArgs.info) {
            EnhancedLogger.log(LogLevel.NORMAL, '')
            displaySignatureProviderInfo(hre)
        }

        try {
            // Choose orchestrator based on legacy flag
            if (taskArgs.legacy) {
                console.log(
                    '📋 Using legacy DeploymentOrchestrator for backwards compatibility'
                )
                return await deployWithLegacyOrchestrator(taskArgs, hre)
            } else {
                console.log(
                    '📋 Using clean DeploymentOrchestrator with signature provider abstraction'
                )
                return await deployWithCleanOrchestrator(taskArgs, hre)
            }
        } catch (error) {
            console.error('❌ Error during clean deployment:', error.message)
            throw error
        }
    })

/**
 * Deploy using the new clean architecture
 */
async function deployWithCleanOrchestrator(
    taskArgs: TaskArgs,
    hre: HardhatRuntimeEnvironment
) {
    try {
        // Create configuration - use selective config if specified
        const config = taskArgs.configFile
            ? DeploymentConfig.load(taskArgs.configFile.replace('.json', ''))
            : DeploymentConfig.getDefaultConfig()

        // Create clean orchestrator (automatically detects and uses appropriate provider)
        const orchestrator = new CleanDeploymentOrchestrator(hre, config)

        console.log(
            `   • Business logics to deploy: ${config.businessLogics.length}`
        )
        console.log(`   • Configured use cases: ${config.useCases.length}`)
        if (taskArgs.configFile) {
            console.log(`   Using selective config: ${taskArgs.configFile}`)
        }
        if (taskArgs.noDeployUseCases) {
            console.log(
                `   ⚠️  Use cases will be registered but NOT deployed (noDeployUseCases flag active)`
            )
        }
        console.log(`   • Network: ${hre.network.name}`)

        const providerInfo = orchestrator.getProviderInfo()
        console.log(`   • Signature curve: ${providerInfo.curve}`)
        console.log('')

        // Run the clean orchestrated deployment
        const deploymentResult = await orchestrator.deploy()

        // Run pre-commit validations if requested
        if (taskArgs.precommit) {
            await runPreCommitValidations(
                taskArgs,
                hre,
                deploymentResult,
                config
            )
        }

        // Show final summary
        console.log('\\n✅ Clean deployment completed successfully!')
        displayFinalSummary(
            deploymentResult,
            providerInfo.curve,
            hre.network.name,
            taskArgs.noDeployUseCases
        )

        if (taskArgs.noDeployUseCases) {
            console.log(
                '\n🔧 Note: Use cases were configured but not deployed (--no-deploy-use-cases flag was active)'
            )
            console.log(
                '   ℹ️ setConfig was called to register configurations, but deployUseCase was skipped'
            )
        }

        return deploymentResult
    } catch (error) {
        console.error('❌ Error during clean deployment:', error.message)
        throw error
    }
}

/**
 * Deploy using the legacy architecture for backwards compatibility
 */
async function deployWithLegacyOrchestrator(
    taskArgs: TaskArgs,
    hre: HardhatRuntimeEnvironment
) {
    try {
        // Create configuration (same as original implementation)
        const config = DeploymentConfig.getDefaultConfig()
        config.governance.accountAddress =
            hre.network.name === 'hardhat'
                ? await hre.ethers
                      .getSigners()
                      .then((signers) => signers[0].address)
                : config.governance.accountAddress

        console.log('\\n📋 LEGACY DEPLOYMENT CONFIGURATION:')
        console.log(
            `   • Business logics to deploy: ${config.businessLogics.length}`
        )
        console.log(`   • Configured use cases: ${config.useCases.length}`)
        if (taskArgs.noDeployUseCases) {
            console.log(
                `   ⚠️  Use cases will be registered but NOT deployed (noDeployUseCases flag active)`
            )
        }
        console.log(`   • Network: ${hre.network.name}`)
        console.log('')

        // Use legacy orchestrator
        const orchestrator = new DeploymentOrchestrator(hre, config)

        // Set deployment options
        const deploymentOptions = {
            skipUseCases: taskArgs.noDeployUseCases === true,
        }

        const deploymentResult = await orchestrator.deploy(deploymentOptions)

        // Run pre-commit validations if requested
        if (taskArgs.precommit) {
            await runPreCommitValidations(
                taskArgs,
                hre,
                deploymentResult,
                config
            )
        }

        // Show final summary
        console.log('\\n✅ Legacy deployment completed successfully!')
        displayFinalSummary(
            deploymentResult,
            'legacy',
            hre.network.name,
            taskArgs.noDeployUseCases
        )

        if (taskArgs.noDeployUseCases) {
            console.log(
                '\n🔧 Note: Use cases were configured but not deployed (--no-deploy-use-cases flag was active)'
            )
            console.log(
                '   ℹ️ setConfig was called to register configurations, but deployUseCase was skipped'
            )
        }

        return deploymentResult
    } catch (error) {
        console.error('❌ Error during legacy deployment:', error.message)
        throw error
    }
}

/**
 * Display signature provider information for debugging
 */
function displaySignatureProviderInfo(hre: HardhatRuntimeEnvironment): void {
    console.log('🔐 SIGNATURE PROVIDER ANALYSIS:')
    console.log('===============================')

    try {
        const curveInfo = SignatureProviderFactory.getCurveInfo(hre)
        console.log(`   • Network: ${curveInfo.networkName}`)
        console.log(
            `   • Supported curves: ${curveInfo.supportedCurves.join(', ')}`
        )
        console.log(`   • Default curve: ${curveInfo.defaultCurve}`)

        const isSecp256k1Supported = SignatureProviderFactory.isCurveSupported(
            hre,
            'secp256k1'
        )
        const isSecp256r1Supported = SignatureProviderFactory.isCurveSupported(
            hre,
            'secp256r1'
        )

        console.log(
            `   • secp256k1 support: ${isSecp256k1Supported ? '✅' : '❌'}`
        )
        console.log(
            `   • secp256r1 support: ${isSecp256r1Supported ? '✅' : '❌'}`
        )
    } catch (error) {
        console.log(`   ❌ Error analyzing providers: ${error.message}`)
    }
}

/**
 * Run pre-commit validations
 */
async function runPreCommitValidations(
    taskArgs: TaskArgs,
    hre: HardhatRuntimeEnvironment,
    deploymentResult: DeploymentResult,
    config: DeploymentConfig
): Promise<void> {
    console.log('\\n🔍 STARTING PRE-COMMIT VALIDATIONS...')

    const validator = new PreCommitValidator(hre, deploymentResult, config)
    const validationResults = await validator.runAllValidations()

    // Report validation results
    console.log('\\n📋 VALIDATION RESULTS:')
    validationResults.forEach((result) => {
        const status = result.success ? '✅' : '❌'
        console.log(`   ${status} ${result.testName}: ${result.message}`)

        if (!result.success && result.error) {
            console.error(`       Error: ${result.error.message}`)
        }
    })

    // Check if all validations passed
    const failedValidations = validationResults.filter((r) => !r.success)
    if (failedValidations.length > 0) {
        console.error(
            `\\n❌ Pre-commit validation failed! ${failedValidations.length}/${validationResults.length} tests failed.`
        )
        throw new Error(
            `Pre-commit validation failed with ${failedValidations.length} errors`
        )
    }

    console.log('\\n✅ All pre-commit validations passed!')
}

/**
 * Display final deployment summary
 */
function displayFinalSummary(
    deploymentResult: DeploymentResult,
    curve: string,
    networkName: string,
    noDeployUseCases: boolean = false
): void {
    console.log('📋 FINAL SUMMARY:')
    const duration =
        deploymentResult.summary.endTime!.getTime() -
        deploymentResult.summary.startTime.getTime()

    console.log(
        `   • Total time: ${duration}ms (${(duration / 1000).toFixed(2)}s)`
    )
    console.log(`   • Signature curve: ${curve}`)
    console.log(
        `   • Deployed logics: ${deploymentResult.businessLogics.filter((bl) => bl.success).length}/${deploymentResult.businessLogics.length}`
    )
    if (noDeployUseCases) {
        console.log(
            `   • Use cases: Skipped deployment (noDeployUseCases flag active)`
        )
    } else {
        console.log(
            `   • Deployed use cases: ${deploymentResult.useCases.filter((uc) => uc.success).length}/${deploymentResult.useCases.length}`
        )
    }
    console.log(
        `   • Network: ${deploymentResult.summary.networkName || 'unknown'}`
    )
}

/**
 * Parse log level from string parameter
 */
function parseLogLevel(logLevelStr?: string): LogLevel {
    if (!logLevelStr) return LogLevel.NORMAL

    switch (logLevelStr.toLowerCase()) {
        case 'minimal':
            return LogLevel.MINIMAL
        case 'normal':
            return LogLevel.NORMAL
        case 'verbose':
            return LogLevel.VERBOSE
        case 'debug':
            return LogLevel.DEBUG
        default:
            console.warn(
                `⚠️  Unknown log level '${logLevelStr}', using 'normal'`
            )
            return LogLevel.NORMAL
    }
}
