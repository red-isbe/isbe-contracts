// tasks/examples/curveAwareDeployAll.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeploymentOrchestrator } from '../deployment/DeploymentOrchestrator'
import { DeploymentConfig } from '../deployment/config/DeploymentConfig'
import { PreCommitValidator } from '../validation/PreCommitValidator'
import { logNetworkInfo, isSecp256r1Network } from '../../utils/networkUtils'

/**
 * Curve-aware version of deployAll task
 * This demonstrates how to modify existing tasks to work with both secp256k1 and secp256r1 networks
 */
task('deployAll:curveAware', 'Deploys system with curve-aware configuration')
    .addFlag('precommit', 'Testing all tasks during pre-commit')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🚀 Starting curve-aware deployment...')

        // Log network and curve information
        logNetworkInfo(hre)

        try {
            if (isSecp256r1Network(hre)) {
                return await deployAllWithSecp256r1()
            } else {
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
 * Standard secp256k1 deployment (same as original deployAll)
 */
async function deployAllWithSecp256k1(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskArgs: any,
    hre: HardhatRuntimeEnvironment
) {
    console.log('📋 Using secp256k1 deployment strategy...')
    console.log('📋 Using default configuration with version 0 for all facets')

    // Create the orchestrator with default configuration
    const config = DeploymentConfig.getDefaultConfig()
    config.governance.accountAddress =
        hre.network.name === 'hardhat'
            ? await hre.ethers
                  .getSigners()
                  .then((signers) => signers[0].address)
            : config.governance.accountAddress

    // Display configuration summary
    console.log('\\n📊 CONFIGURATION SUMMARY:')
    console.log(
        `   • Business logics to deploy: ${config.businessLogics.length}`
    )
    console.log(`   • Configured use cases: ${config.useCases.length}`)
    console.log(`   • Default version: 0 (latest)`)

    const orchestrator = new DeploymentOrchestrator(hre, config)

    // Run the orchestrated deployment without options (all enabled)
    const deploymentResult = await orchestrator.deploy()

    if (taskArgs.precommit) {
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

    // Show final summary
    console.log('\\n✅ secp256k1 deployment completed successfully!')
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
}

/**
 * Custom secp256r1 deployment strategy
 */
async function deployAllWithSecp256r1() {
    console.log('📋 Using secp256r1 deployment strategy...')

    console.warn('⚠️  secp256r1 deployment limitations:')
    console.warn('    - Custom key management required')
    console.warn('    - Transaction signing must be implemented')
    console.warn('    - Network compatibility must be verified')

    // For secp256r1 networks, you would need to:
    // 1. Load secp256r1 private keys from secure storage
    // 2. Create custom signers that use secp256r1
    // 3. Modify the deployment orchestrator to use custom signers
    // 4. Handle any network-specific configurations

    // Example of what you would need to implement:
    console.log('\\n🔧 Required secp256r1 implementation steps:')
    console.log('   1. Implement secp256r1 key loading')
    console.log('   2. Create custom secp256r1 signers')
    console.log('   3. Modify DeploymentOrchestrator for secp256r1')
    console.log('   4. Update validation for secp256r1 networks')

    // Placeholder for actual implementation
    const mockDeploymentResult = {
        summary: {
            startTime: new Date(),
            endTime: new Date(),
        },
        businessLogics: [],
        useCases: [],
        governance: {
            success: true,
            addresses: {},
        },
    }

    console.log('\\n✅ secp256r1 deployment simulation completed!')
    console.log('💡 This would require implementing:')
    console.log('   • secp256r1 cryptographic library integration')
    console.log('   • Custom wallet and signer classes')
    console.log('   • Modified deployment orchestration')
    console.log('   • Network-specific configuration handling')

    return mockDeploymentResult
}
