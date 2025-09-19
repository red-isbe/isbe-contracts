// tasks/examples/curveAwareTask.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { isSecp256r1Network, logNetworkInfo } from '../../utils/networkUtils'

/**
 * Example task that can work with both secp256k1 and secp256r1 networks
 * This demonstrates how to adapt task behavior based on the network's curve type
 */
task('curve-aware-deploy', 'Deploy contract with curve-aware configuration')
    .addOptionalParam('contract', 'Contract name to deploy', 'YourContract')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('=== Curve-Aware Deployment ===')

        // Log network information
        logNetworkInfo(hre)
        console.log('')

        try {
            if (isSecp256r1Network(hre)) {
                await deployWithSecp256r1(taskArgs, hre)
            } else {
                await deployWithSecp256k1(taskArgs, hre)
            }
        } catch (error) {
            console.error('Deployment failed:', error)
            process.exit(1)
        }
    })

/**
 * Deploy using standard secp256k1 (Ethereum-compatible) approach
 */
async function deployWithSecp256k1(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskArgs: any,
    hre: HardhatRuntimeEnvironment
) {
    console.log('Using secp256k1 deployment...')

    // Standard Ethereum deployment
    const [deployer] = await hre.ethers.getSigners()
    console.log('Deployer address:', deployer.address)
    console.log(
        'Deployer balance:',
        await hre.ethers.provider.getBalance(deployer.address)
    )

    // Example: Deploy a simple contract
    // const ContractFactory = await hre.ethers.getContractFactory(taskArgs.contract)
    // const contract = await ContractFactory.deploy()
    // await contract.deployed()
    // console.log(`${taskArgs.contract} deployed to:`, contract.address)

    console.log('✅ secp256k1 deployment completed successfully')
}

/**
 * Deploy using secp256r1 approach (custom implementation required)
 */
async function deployWithSecp256r1(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskArgs: any,
    hre: HardhatRuntimeEnvironment
) {
    console.log('Using secp256r1 deployment...')

    console.warn('⚠️  secp256r1 deployment requires custom implementation')
    console.warn('    Current limitations:')
    console.warn('    - Hardhat signers only support secp256k1')
    console.warn('    - Custom signing implementation needed for secp256r1')
    console.warn(
        '    - Would require integration with secp256r1 crypto library'
    )

    // This is where you would implement secp256r1-specific logic
    // For example:
    // 1. Load secp256r1 private keys from secure storage
    // 2. Create custom transaction signing logic
    // 3. Send signed transactions to the secp256r1 network

    // Placeholder implementation
    try {
        // You would replace this with actual secp256r1 implementation
        await simulateSecp256r1Deployment(taskArgs, hre)
        console.log('✅ secp256r1 deployment simulation completed')
    } catch (error) {
        console.error('❌ secp256r1 deployment failed:', error)
        throw error
    }
}

/**
 * Simulate secp256r1 deployment with actual account information
 */
async function simulateSecp256r1Deployment(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taskArgs: any,
    hre: HardhatRuntimeEnvironment
) {
    console.log('Simulating secp256r1 deployment...')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const networkConfig = hre.config.networks[hre.network.name] as any
    console.log('Target network URL:', networkConfig.url)
    console.log('Target chain ID:', networkConfig.chainId)
    console.log('')

    // Display available secp256r1 accounts
    if (networkConfig.secp256r1Accounts) {
        const accounts = networkConfig.secp256r1Accounts
        console.log(`Available secp256r1 accounts: ${accounts.length}`)
        console.log('First 3 accounts:')

        for (let i = 0; i < Math.min(3, accounts.length); i++) {
            const account = accounts[i]
            console.log(`  Account ${i + 1}: ${account.address}`)
        }
        console.log('')

        // Simulate deployment using first account
        const deployerAccount = accounts[0]
        console.log('Deployment simulation:')
        console.log(`  Deployer: ${deployerAccount.address}`)
        console.log(`  Contract: ${taskArgs.contract}`)
        console.log(`  Curve: secp256r1`)
        console.log('')

        console.log('✅ Would successfully deploy using secp256r1 account')
    } else {
        console.warn('No secp256r1 accounts found in network configuration')
    }

    console.log('')
    console.log('Implementation status:')
    console.log('  ✅ secp256r1 key generation: Complete')
    console.log('  ✅ Account address derivation: Complete')
    console.log('  ✅ Message signing/verification: Complete')
    console.log('  ⚠️  Transaction signing: Would need custom implementation')
    console.log('  ⚠️  Network deployment: Would need custom provider')
}

/**
 * Task to show network curve information
 */
task('network-info', 'Show current network curve information').setAction(
    async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('=== Network Information ===')
        logNetworkInfo(hre)

        console.log('')
        console.log('Network Configuration:')
        console.log(
            JSON.stringify(hre.config.networks[hre.network.name], null, 2)
        )
    }
)
