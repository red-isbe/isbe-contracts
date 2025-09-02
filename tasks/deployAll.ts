import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeploymentOrchestrator } from './deployment/DeploymentOrchestrator'
import { DeploymentConfig } from './deployment/config/DeploymentConfig'
import { PreCommitValidator } from './validation/PreCommitValidator'

/**
 * Main deployment task that orchestrates the complete system deployment
 * npx hardhat deployAll --pre-commit
 */
task('deployAll', 'Deploys a governance factory and runs all test scripts')
    .addFlag('precommit', 'Testing all tasks during pre-commit')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🚀 Starting complete system deployment...')
        console.log(
            '📋 Using default configuration with version 0 for all facets'
        )

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
            console.log('\n📊 CONFIGURATION SUMMARY:')
            console.log(
                `   • Business logics to deploy: ${config.businessLogics.length}`
            )
            console.log(`   • Configured use cases: ${config.useCases.length}`)
            console.log(`   • Default version: 0 (latest)`)

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
            console.log('\n✅ Deployment completed successfully!')
            console.log('📊 FINAL SUMMARY:')
            console.log(
                `   • Total time: ${deploymentResult.summary.endTime.getTime() - deploymentResult.summary.startTime.getTime()}ms`
            )
            console.log(
                `   • Deployed logics: ${deploymentResult.businessLogics.filter((bl) => bl.success).length}/${deploymentResult.businessLogics.length}`
            )
            console.log(
                `   • Deployed use cases: ${deploymentResult.useCases.filter((uc) => uc.success).length}/${deploymentResult.useCases.length}`
            )

            return deploymentResult
        } catch (error) {
            console.error('❌ Error during deployment:', error.message)
            throw error
        }
    })
