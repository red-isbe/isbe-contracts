import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeploymentOrchestrator } from './deployment/DeploymentOrchestrator'
import { DeploymentConfig } from './deployment/config/DeploymentConfig'
import { PreCommitValidator } from './validation/PreCommitValidator'
import { isSecp256r1Network, logNetworkInfo } from '../utils/networkUtils'

interface TaskArgs {
    precommit?: boolean
    info?: boolean
}

/**
 * Curve-aware deployment task that orchestrates the complete system deployment
 * Works with both secp256k1 and secp256r1 networks automatically
 * npx hardhat deployAll --precommit
 */
task(
    'deployAll',
    'Deploys a governance factory and runs all test scripts (curve-aware)'
)
    .addFlag('precommit', 'Testing all tasks during pre-commit')
    .addFlag('info', 'Show detailed network and curve information')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🚀 Starting curve-aware system deployment...')

        // Display network and curve information
        console.log('')
        logNetworkInfo(hre)
        console.log('')

        if (taskArgs.info) {
            console.log(
                '📋 Deployment will adapt to network curve automatically'
            )
            console.log('')
        }

        try {
            if (isSecp256r1Network(hre)) {
                console.log(
                    '📋 Detected secp256r1 network - using curve-aware deployment strategy'
                )
                return await deployAllWithSecp256r1(taskArgs, hre)
            } else {
                console.log(
                    '📋 Detected secp256k1 network - using standard deployment strategy'
                )
                return await deployAllWithSecp256k1(taskArgs, hre)
            }
        } catch (error) {
            console.error(
                '❌ Error during curve-aware deployment:',
                error.message
            )
            throw error
        }
    })

/**
 * Standard secp256k1 deployment (original implementation)
 */
async function deployAllWithSecp256k1(
    taskArgs: TaskArgs,
    hre: HardhatRuntimeEnvironment
) {
    console.log('Using standard Ethereum deployment strategy...')

    try {
        // Create the orchestrator with default configuration
        const config = DeploymentConfig.getDefaultConfig()
        config.governance.accountAddress =
            hre.network.name === 'hardhat'
                ? await hre.ethers
                      .getSigners()
                      .then((signers) => signers[0].address)
                : config.governance.accountAddress

        // Display configuration summary
        console.log('\n📋 CONFIGURATION SUMMARY:')
        console.log(
            `   • Business logics to deploy: ${config.businessLogics.length}`
        )
        console.log(`   • Configured use cases: ${config.useCases.length}`)
        console.log(`   • Default version: 0 (latest)`)
        console.log(`   • Curve: secp256k1 (standard Ethereum)`)

        const orchestrator = new DeploymentOrchestrator(hre, config)

        // Run the orchestrated deployment without options (all enabled)
        const deploymentResult = await orchestrator.deploy()

        if (taskArgs.precommit) {
            console.log('\n🔍 STARTING PRE-COMMIT VALIDATIONS...')

            const validator = new PreCommitValidator(
                hre,
                deploymentResult,
                config
            )
            const validationResults = await validator.runAllValidations()

            // Report validation results
            console.log('\n📋 VALIDATION RESULTS:')
            validationResults.forEach((result) => {
                const status = result.success ? '✅' : '❌'
                console.log(
                    `   ${status} ${result.testName}: ${result.message}`
                )

                if (!result.success && result.error) {
                    console.error(`       Error: ${result.error.message}`)
                }
            })

            // Check if all validations passed
            const failedValidations = validationResults.filter(
                (r) => !r.success
            )
            if (failedValidations.length > 0) {
                console.error(
                    `\n❌ Pre-commit validation failed! ${failedValidations.length}/${validationResults.length} tests failed.`
                )
                throw new Error(
                    `Pre-commit validation failed with ${failedValidations.length} errors`
                )
            }

            console.log('\n✅ All pre-commit validations passed!')
        }

        // Show final summary
        console.log('\n✅ secp256k1 deployment completed successfully!')
        console.log('📋 FINAL SUMMARY:')
        console.log(
            `   • Total time: ${deploymentResult.summary.endTime.getTime() - deploymentResult.summary.startTime.getTime()}ms`
        )
        console.log(
            `   • Deployed logics: ${deploymentResult.businessLogics.filter((bl) => bl.success).length}/${deploymentResult.businessLogics.length}`
        )
        console.log(
            `   • Deployed use cases: ${deploymentResult.useCases.filter((uc) => uc.success).length}/${deploymentResult.useCases.length}`
        )
        console.log(`   • Network curve: secp256k1`)

        return deploymentResult
    } catch (error) {
        console.error('❌ Error during secp256k1 deployment:', error.message)
        throw error
    }
}

/**
 * secp256r1 real deployment strategy
 */
async function deployAllWithSecp256r1(
    taskArgs: TaskArgs,
    hre: HardhatRuntimeEnvironment
) {
    console.log('Using secp256r1 real deployment strategy...')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const networkConfig = hre.config.networks[hre.network.name] as any

    // Check if we have secp256r1 accounts available
    if (
        !networkConfig.secp256r1Accounts ||
        networkConfig.secp256r1Accounts.length === 0
    ) {
        throw new Error(
            'No secp256r1 accounts found in network configuration. ' +
                'Ensure your network has secp256r1Accounts configured.'
        )
    }

    console.log('🚀 secp256r1 real deployment:')
    console.log('    ✅ Using secp256r1 accounts from .env configuration')
    console.log('    ✅ Performing actual contract deployment')
    console.log('    ✅ Network supports secp256r1 curve operations')
    console.log('')

    try {
        // Create the orchestrator with default configuration for secp256r1
        const config = DeploymentConfig.getDefaultConfig()

        // Use first secp256r1 account as governance address
        const secp256r1Accounts = networkConfig.secp256r1Accounts
        config.governance.accountAddress = secp256r1Accounts[0].address

        console.log('\n📋 SECP256R1 CONFIGURATION SUMMARY:')
        console.log(
            `   • Business logics to deploy: ${config.businessLogics.length}`
        )
        console.log(`   • Configured use cases: ${config.useCases.length}`)
        console.log(`   • Default version: 0 (latest)`)
        console.log(`   • Curve: secp256r1 (P-256)`)
        console.log(`   • Available accounts: ${secp256r1Accounts.length}`)
        console.log(
            `   • Deployer address: ${config.governance.accountAddress}`
        )
        console.log('')

        // Perform real deployment using the orchestrator
        console.log('🚀 STARTING REAL SECP256R1 DEPLOYMENT:')
        console.log(
            '\n💡 Note: Using standard Ethereum signers with secp256r1 keys'
        )
        console.log(
            '       (secp256r1 keys are valid secp256k1 keys mathematically)'
        )
        console.log('')

        const orchestrator = new DeploymentOrchestrator(hre, config)

        // Run the orchestrated deployment
        const deploymentResult = await orchestrator.deploy()

        if (taskArgs.precommit) {
            console.log('\n🔍 STARTING SECP256R1 PRE-COMMIT VALIDATIONS...')

            const validator = new PreCommitValidator(
                hre,
                deploymentResult,
                config
            )
            const validationResults = await validator.runAllValidations()

            // Report validation results
            console.log('\n📋 VALIDATION RESULTS:')
            validationResults.forEach((result) => {
                const status = result.success ? '✅' : '❌'
                console.log(
                    `   ${status} ${result.testName}: ${result.message}`
                )

                if (!result.success && result.error) {
                    console.error(`       Error: ${result.error.message}`)
                }
            })

            // Check if all validations passed
            const failedValidations = validationResults.filter(
                (r) => !r.success
            )
            if (failedValidations.length > 0) {
                console.error(
                    `\n❌ Pre-commit validation failed! ${failedValidations.length}/${validationResults.length} tests failed.`
                )
                throw new Error(
                    `Pre-commit validation failed with ${failedValidations.length} errors`
                )
            }

            console.log('\n✅ All secp256r1 pre-commit validations passed!')
        }

        // Show final summary
        console.log('\n✅ secp256r1 deployment completed successfully!')
        console.log('📋 FINAL SUMMARY:')
        console.log(
            `   • Total time: ${deploymentResult.summary.endTime.getTime() - deploymentResult.summary.startTime.getTime()}ms`
        )
        console.log(
            `   • Deployed logics: ${deploymentResult.businessLogics.filter((bl) => bl.success).length}/${deploymentResult.businessLogics.length}`
        )
        console.log(
            `   • Deployed use cases: ${deploymentResult.useCases.filter((uc) => uc.success).length}/${deploymentResult.useCases.length}`
        )
        console.log(`   • Network curve: secp256r1`)
        console.log(`   • Deployer: ${config.governance.accountAddress}`)

        return deploymentResult
    } catch (error) {
        console.error('❌ Error during secp256r1 deployment:', error.message)
        throw error
    }
}
