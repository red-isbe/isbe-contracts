// tasks/secp256r1/showAccounts.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    isSecp256r1Network,
    getNetworkCurveInfo,
} from '../../utils/networkUtils'
import {
    demonstrateSecp256r1Operations,
    generateSecp256r1Accounts,
} from '../../utils/secp256r1Utils'
import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Task to display secp256r1 account information for customR1Network
 */
task('show-secp256r1-accounts', 'Display secp256r1 account addresses and keys')
    .addFlag('demo', 'Run secp256r1 operations demonstration')
    .addOptionalParam('count', 'Number of accounts to display', '10')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('=== secp256r1 Account Information ===')

        const curveInfo = getNetworkCurveInfo(hre)
        console.log(`Network: ${curveInfo.networkName}`)
        console.log(`Curve: ${curveInfo.curve}`)
        console.log(`Chain ID: ${curveInfo.chainId}`)
        console.log(`URL: ${curveInfo.url}`)
        console.log('')

        if (!isSecp256r1Network(hre)) {
            console.warn('⚠️  This task is designed for secp256r1 networks')
            console.log('💡 Try running with: --network customR1Network')
            return
        }

        // Get network configuration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const networkConfig = hre.config.networks[hre.network.name] as any

        if (!networkConfig.secp256r1Accounts) {
            console.error(
                '❌ No secp256r1Accounts found in network configuration'
            )
            return
        }

        const accounts = networkConfig.secp256r1Accounts
        const displayCount = Math.min(parseInt(taskArgs.count), accounts.length)

        console.log(
            `📋 Displaying ${displayCount} of ${accounts.length} secp256r1 accounts:`
        )
        console.log('')

        // Display account information
        for (let i = 0; i < displayCount; i++) {
            const account = accounts[i]
            console.log(`Account ${i + 1}:`)
            console.log(`  Address:            ${account.address}`)
            console.log(`  Private Key:        0x${account.privateKey}`)
            console.log(`  Public Key:         ${account.publicKey}`)
            console.log(`  Compressed PubKey:  ${account.compressedPublicKey}`)
            console.log('')
        }

        // Show summary
        console.log('📊 SUMMARY:')
        console.log(`   • Total accounts generated: ${accounts.length}`)
        console.log(`   • Curve type: ${curveInfo.curve} (P-256/prime256v1)`)
        console.log(
            `   • Address format: Ethereum-compatible (Keccak-256 hash)`
        )
        console.log(`   • Private key format: 32-byte hex string`)
        console.log('')

        // Security notice
        console.log('🔒 SECURITY NOTICE:')
        console.log('   • These are test accounts for development only')
        console.log('   • Never use these private keys on production networks')
        console.log('   • Store production keys securely and never log them')

        if (taskArgs.demo) {
            console.log('')
            demonstrateSecp256r1Operations()
        }
    })

/**
 * Task to generate new secp256r1 accounts
 */
task('generate-secp256r1-accounts', 'Generate new secp256r1 accounts')
    .addOptionalParam('count', 'Number of accounts to generate', '5')
    .addFlag('save', 'Save accounts to a JSON file')
    .setAction(async (taskArgs) => {
        console.log('=== Generating New secp256r1 Accounts ===')
        console.log('')

        const count = parseInt(taskArgs.count)
        const newAccounts = generateSecp256r1Accounts(count)

        console.log(`Generated ${count} new secp256r1 accounts:`)
        console.log('')

        newAccounts.forEach((account, index) => {
            console.log(`Account ${index + 1}:`)
            console.log(`  Address:     ${account.address}`)
            console.log(`  Private Key: 0x${account.privateKey}`)
            console.log('')
        })

        if (taskArgs.save) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const filename = `secp256r1-accounts-${timestamp}.json`
            const filepath = join(process.cwd(), filename)

            const accountData = {
                timestamp: new Date().toISOString(),
                curve: 'secp256r1',
                count: count,
                accounts: newAccounts,
            }

            writeFileSync(filepath, JSON.stringify(accountData, null, 2))
            console.log(`💾 Accounts saved to: ${filename}`)
        }

        console.log('🔒 SECURITY NOTICE:')
        console.log('   • These accounts are for development/testing only')
        console.log('   • Never use these on production networks')
        console.log('   • Store production keys securely')
    })

/**
 * Task to test secp256r1 cryptographic operations
 */
task(
    'test-secp256r1-crypto',
    'Test secp256r1 cryptographic operations'
).setAction(async () => {
    console.log('=== secp256r1 Cryptographic Operations Test ===')
    console.log('')

    demonstrateSecp256r1Operations()

    console.log('')
    console.log('✅ secp256r1 cryptographic operations test completed!')
})
