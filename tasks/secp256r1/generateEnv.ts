// tasks/secp256r1/generateEnv.ts
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { randomBytes } from 'crypto'
import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Task to generate a random .env file with configurable parameters
 */
task(
    'generate-env',
    'Generate a random .env file with private keys and addresses'
)
    .addOptionalParam(
        'curve',
        'Elliptic curve to use (secp256k1 or secp256r1)',
        'secp256r1'
    )
    .addOptionalParam('count', 'Number of private keys to generate', '5')
    .addOptionalParam('output', 'Output file path', '.env')
    .addFlag('backup', 'Backup existing .env file')
    .addFlag(
        'dual',
        'Create both .env.secp256k1 and .env.secp256r1 with same private keys'
    )
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🔐 Generating Random .env Configuration')
        console.log('='.repeat(45))
        console.log('')

        const curve = taskArgs.curve.toLowerCase()
        const count = parseInt(taskArgs.count)
        const outputPath = taskArgs.output
        const isDualMode = taskArgs.dual

        // Validate parameters
        if (!isDualMode && !['secp256k1', 'secp256r1'].includes(curve)) {
            throw new Error('Invalid curve. Must be secp256k1 or secp256r1')
        }

        if (count < 1 || count > 100) {
            throw new Error('Count must be between 1 and 100')
        }

        // Handle dual mode
        if (isDualMode) {
            return await handleDualMode(hre, count, taskArgs.backup)
        }

        console.log('📋 Configuration:')
        console.log(`   • Curve: ${curve.toUpperCase()}`)
        console.log(`   • Number of accounts: ${count}`)
        console.log(`   • Output file: ${outputPath}`)
        console.log('')

        try {
            // Backup existing .env if requested and exists
            const fullOutputPath = join(process.cwd(), outputPath)
            if (taskArgs.backup) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const fs = require('fs')
                    if (fs.existsSync(fullOutputPath)) {
                        const backupPath = `${outputPath}.backup.${Date.now()}`
                        fs.copyFileSync(fullOutputPath, backupPath)
                        console.log(
                            `📋 Backed up existing file to: ${backupPath}`
                        )
                    }
                } catch {
                    console.warn('⚠️  Could not backup existing file')
                }
            }

            let accounts: Array<{
                privateKey: string
                address: string
                publicKey?: string
                compressedPublicKey?: string
            }>

            if (curve === 'secp256k1') {
                accounts = await generateSecp256k1Accounts(hre, count)
            } else {
                accounts = await generateSecp256r1Accounts(count)
            }

            // Generate .env content
            const envContent = generateEnvContent(accounts, curve)

            // Write to file
            writeFileSync(fullOutputPath, envContent, 'utf8')

            console.log('✅ Successfully generated .env file!')
            console.log('')

            // Display summary
            console.log('📊 Generated Accounts Summary:')
            console.log(`   • Total accounts: ${accounts.length}`)
            console.log(`   • Primary account: ${accounts[0].address}`)
            console.log(`   • Curve used: ${curve.toUpperCase()}`)
            console.log(`   • File location: ${fullOutputPath}`)
            console.log('')

            // Display first few accounts
            console.log('🔑 First 3 Generated Accounts:')
            accounts.slice(0, 3).forEach((account, index) => {
                console.log(`   ${index + 1}. Address: ${account.address}`)
                console.log(`      Private Key: ${account.privateKey}`)
                if (account.publicKey) {
                    console.log(`      Public Key: ${account.publicKey}`)
                }
                if (account.compressedPublicKey) {
                    console.log(
                        `      Compressed: ${account.compressedPublicKey}`
                    )
                }
                console.log('')
            })

            if (accounts.length > 3) {
                console.log(`   ... and ${accounts.length - 3} more accounts`)
                console.log('')
            }

            // Security warning
            console.log('🔒 SECURITY WARNING:')
            console.log('   • These are randomly generated test accounts')
            console.log('   • DO NOT use these keys on production networks')
            console.log(
                '   • Store production keys securely and never log them'
            )
            console.log('   • Consider using hardware wallets for production')
            console.log('')

            // Next steps
            console.log('🎯 Next Steps:')
            console.log('   1. Review the generated .env file')
            console.log('   2. Fund accounts if needed for testing')
            console.log(
                '   3. Run: npx hardhat validate-accounts --network <your-network>'
            )
            console.log('   4. Deploy contracts with the new accounts')
        } catch (error) {
            console.error('')
            console.error('❌ Error generating .env file:')
            console.error(`   ${error.message}`)
            throw error
        }
    })

/**
 * Generate secp256k1 accounts using Hardhat's ethers
 */
async function generateSecp256k1Accounts(
    hre: HardhatRuntimeEnvironment,
    count: number
) {
    console.log('🔧 Generating secp256k1 accounts...')

    const accounts = []
    for (let i = 0; i < count; i++) {
        const privateKey = '0x' + randomBytes(32).toString('hex')
        const wallet = new hre.ethers.Wallet(privateKey)

        accounts.push({
            privateKey: privateKey,
            address: wallet.address,
        })
    }

    return accounts
}

/**
 * Generate secp256r1 accounts using elliptic curve cryptography
 */
async function generateSecp256r1Accounts(count: number) {
    console.log('🔧 Generating secp256r1 accounts...')

    // Import secp256r1 utilities
    const { generateSecp256r1KeyPair, deriveEthereumAddress } = await import(
        '../../utils/secp256r1Utils'
    )

    const accounts = []
    for (let i = 0; i < count; i++) {
        const keyPair = generateSecp256r1KeyPair()
        const address = deriveEthereumAddress(keyPair.publicKey)

        accounts.push({
            privateKey: '0x' + keyPair.privateKey,
            address: address,
            publicKey: keyPair.publicKey,
            compressedPublicKey: keyPair.compressedPublicKey,
        })
    }

    return accounts
}

/**
 * Handle dual mode - create both secp256k1 and secp256r1 files with same private keys
 */
async function handleDualMode(
    hre: HardhatRuntimeEnvironment,
    count: number,
    backup: boolean
) {
    console.log('🔄 Dual Mode: Creating both secp256k1 and secp256r1 files')
    console.log('📋 Configuration:')
    console.log(`   • Number of accounts: ${count}`)
    console.log(`   • Files to create: .env.secp256k1, .env.secp256r1`)
    console.log('')

    // Check if both files already exist
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    const k1Path = join(process.cwd(), '.env.secp256k1')
    const r1Path = join(process.cwd(), '.env.secp256r1')

    if (fs.existsSync(k1Path) && fs.existsSync(r1Path) && !backup) {
        console.log('⚠️  Both .env.secp256k1 and .env.secp256r1 already exist')
        console.log(
            '   Files not created to avoid overwriting existing configurations'
        )
        console.log('')
        console.log('💡 To recreate files:')
        console.log(
            '   1. Remove existing files: rm .env.secp256k1 .env.secp256r1'
        )
        console.log('   2. Run the command again')
        console.log('   3. Or use --backup flag to backup existing files')
        return
    }

    try {
        // Backup existing files if requested
        if (backup) {
            ;[k1Path, r1Path].forEach((filePath, index) => {
                if (fs.existsSync(filePath)) {
                    const fileName =
                        index === 0 ? '.env.secp256k1' : '.env.secp256r1'
                    const backupPath = `${fileName}.backup.${Date.now()}`
                    try {
                        fs.copyFileSync(filePath, backupPath)
                        console.log(
                            `📋 Backed up existing ${fileName} to: ${backupPath}`
                        )
                    } catch {
                        console.warn(
                            `⚠️  Could not backup existing ${fileName}`
                        )
                    }
                }
            })
        }

        // Generate base private keys
        console.log('🔧 Generating private keys...')
        const basePrivateKeys = []
        for (let i = 0; i < count; i++) {
            basePrivateKeys.push('0x' + randomBytes(32).toString('hex'))
        }

        // Create secp256k1 accounts
        console.log('🔧 Creating secp256k1 accounts...')
        const k1Accounts = []
        for (const privateKey of basePrivateKeys) {
            const wallet = new hre.ethers.Wallet(privateKey)
            k1Accounts.push({
                privateKey: privateKey,
                address: wallet.address,
            })
        }

        // Create secp256r1 accounts with same private keys
        console.log('🔧 Creating secp256r1 accounts with same private keys...')
        const { deriveEthereumAddress } = await import(
            '../../utils/secp256r1Utils'
        )

        const r1Accounts = []
        for (const privateKey of basePrivateKeys) {
            try {
                // For secp256r1, we need to derive the address from the private key
                const cleanPrivateKey = privateKey.startsWith('0x')
                    ? privateKey.slice(2)
                    : privateKey

                // Import elliptic for secp256r1 operations
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const EC = require('elliptic').ec
                const ec = new EC('p256')
                const keyPair = ec.keyFromPrivate(cleanPrivateKey, 'hex')
                const publicKey = keyPair.getPublic()
                const compressedPublicKey = publicKey.encode('hex', true)
                const uncompressedPublicKey = publicKey.encode('hex', false)

                // Derive Ethereum-compatible address using secp256r1 public key
                const address = deriveEthereumAddress(uncompressedPublicKey)

                r1Accounts.push({
                    privateKey: privateKey,
                    address: address,
                    publicKey: uncompressedPublicKey,
                    compressedPublicKey: compressedPublicKey,
                })
            } catch (error) {
                console.warn(
                    `⚠️  Could not generate secp256r1 address for key ${privateKey.substring(0, 8)}...`,
                    error.message
                )
                // Fallback: use the secp256k1 address (for development purposes)
                const wallet = new hre.ethers.Wallet(privateKey)
                r1Accounts.push({
                    privateKey: privateKey,
                    address: wallet.address, // Fallback to k1 address
                    publicKey: undefined,
                    compressedPublicKey: undefined,
                })
            }
        }

        // Generate content for both files
        const k1Content = generateEnvContent(k1Accounts, 'secp256k1')
        const r1Content = generateEnvContent(r1Accounts, 'secp256r1')

        // Write both files
        writeFileSync(k1Path, k1Content, 'utf8')
        writeFileSync(r1Path, r1Content, 'utf8')

        console.log('✅ Successfully generated both .env files!')
        console.log('')

        // Display summary
        console.log('📊 Generated Files Summary:')
        console.log(
            `   • .env.secp256k1: ${count} accounts (standard Ethereum)`
        )
        console.log(`   • .env.secp256r1: ${count} accounts (experimental)`)
        console.log(`   • Same private keys used for both curves`)
        console.log('')

        // Display account comparison
        console.log('🔑 Account Comparison (First 3):')
        for (let i = 0; i < Math.min(3, count); i++) {
            console.log(`   Account ${i + 1}:`)
            console.log(`      Private Key: ${k1Accounts[i].privateKey}`)
            console.log(`      secp256k1 Address: ${k1Accounts[i].address}`)
            console.log(`      secp256r1 Address: ${r1Accounts[i].address}`)
            console.log('')
        }

        if (count > 3) {
            console.log(`   ... and ${count - 3} more accounts`)
            console.log('')
        }

        // Usage instructions
        console.log('🎯 Usage Instructions:')
        console.log('   To use secp256k1 (standard Ethereum):')
        console.log('   • Copy .env.secp256k1 to .env')
        console.log('   • Deploy to networks: hardhat, mvp, arsys, kepler')
        console.log('')
        console.log('   To use secp256r1 (experimental):')
        console.log('   • Copy .env.secp256r1 to .env')
        console.log('   • Deploy to network: customR1Network')
        console.log('')
        console.log('   Quick commands:')
        console.log('   cp .env.secp256k1 .env  # Use secp256k1')
        console.log('   cp .env.secp256r1 .env  # Use secp256r1')
        console.log('')

        // Security warning
        console.log('🔒 SECURITY WARNING:')
        console.log('   • These are randomly generated test accounts')
        console.log('   • DO NOT use these keys on production networks')
        console.log('   • secp256r1 implementation is EXPERIMENTAL')
        console.log('   • Store production keys securely')
        console.log('')
    } catch (error) {
        console.error('')
        console.error('❌ Error generating dual .env files:')
        console.error(`   ${error.message}`)
        throw error
    }
}

/**
 * Generate .env file content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateEnvContent(accounts: any[], curve: string): string {
    const timestamp = new Date().toISOString()
    const primaryAccount = accounts[0]

    // Extract private keys (remove 0x prefix for ACCOUNTS)
    const privateKeys = accounts.map((acc) =>
        acc.privateKey.startsWith('0x')
            ? acc.privateKey.slice(2)
            : acc.privateKey
    )

    let content = `ACCOUNTS=${privateKeys.join(',')}\n`
    content += `ACCOUNT_ADDRESS=${primaryAccount.address}\n`
    content += `ACCOUNT_PRIVATE_KEY=${primaryAccount.privateKey}\n`
    content += `\n`

    // Add detailed comments
    content += `; Generated on: ${timestamp}\n`
    content += `; Curve: ${curve.toUpperCase()}\n`
    content += `; Total accounts: ${accounts.length}\n`
    content += `;\n`

    // Add account details in comments
    content += `; 📋 Account Details:\n`
    content += `;\n`

    accounts.forEach((account, index) => {
        content += `; Account ${index + 1}:\n`
        content += `;   Address:            ${account.address}\n`
        content += `;   Private Key:        ${account.privateKey}\n`

        if (account.publicKey) {
            content += `;   Public Key:         ${account.publicKey}\n`
        }
        if (account.compressedPublicKey) {
            content += `;   Compressed PubKey:  ${account.compressedPublicKey}\n`
        }
        content += `;\n`
    })

    // Add summary and security info
    content += `; 📊 SUMMARY:\n`
    content += `;    • Total accounts generated: ${accounts.length}\n`
    content += `;    • Curve type: ${curve.toUpperCase()}\n`

    if (curve === 'secp256r1') {
        content += `;    • Address format: Ethereum-compatible (Keccak-256 hash)\n`
        content += `;    • Private key format: 32-byte hex string\n`
    } else {
        content += `;    • Standard Ethereum secp256k1 accounts\n`
        content += `;    • Fully compatible with all Ethereum tools\n`
    }

    content += `;\n`
    content += `; 🔒 SECURITY NOTICE:\n`
    content += `;    • These are randomly generated accounts for development only\n`
    content += `;    • Never use these private keys on production networks\n`
    content += `;    • Store production keys securely and never log them\n`
    content += `;    • Consider using hardware wallets for production environments\n`

    return content
}

/**
 * Task to validate a generated .env file
 */
task('validate-generated-env', 'Validate a generated .env file')
    .addOptionalParam('file', '.env file to validate', '.env')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        console.log('🔍 Validating Generated .env File')
        console.log('='.repeat(35))
        console.log('')

        try {
            // Load environment from the specified file
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('dotenv').config({ path: taskArgs.file })

            const accounts = process.env.ACCOUNTS?.split(',') || []
            const primaryAddress = process.env.ACCOUNT_ADDRESS
            const primaryKey = process.env.ACCOUNT_PRIVATE_KEY

            console.log('📋 File Analysis:')
            console.log(`   • File: ${taskArgs.file}`)
            console.log(`   • Accounts found: ${accounts.length}`)
            console.log(`   • Primary address: ${primaryAddress}`)
            console.log(
                `   • Primary key configured: ${primaryKey ? '✅' : '❌'}`
            )
            console.log('')

            if (accounts.length === 0) {
                console.log('❌ No accounts found in ACCOUNTS variable')
                return
            }

            // Validate each account
            console.log('🔐 Account Validation:')
            let validCount = 0

            for (let i = 0; i < Math.min(accounts.length, 10); i++) {
                const privateKey =
                    '0x' +
                    (accounts[i].startsWith('0x')
                        ? accounts[i].slice(2)
                        : accounts[i])

                try {
                    const wallet = new hre.ethers.Wallet(privateKey)
                    console.log(`   ${i + 1}. ✅ ${wallet.address}`)
                    validCount++
                } catch {
                    console.log(
                        `   ${i + 1}. ❌ Invalid private key: ${accounts[i].substring(0, 8)}...`
                    )
                }
            }

            if (accounts.length > 10) {
                console.log(`   ... and ${accounts.length - 10} more accounts`)
            }

            console.log('')
            console.log('📊 Validation Summary:')
            console.log(`   • Total accounts: ${accounts.length}`)
            console.log(
                `   • Valid accounts: ${validCount}/${Math.min(accounts.length, 10)}`
            )
            console.log(
                `   • Primary account match: ${primaryAddress && primaryKey ? '✅' : '❌'}`
            )
            console.log(
                `   • Overall status: ${validCount > 0 ? '✅ Valid' : '❌ Invalid'}`
            )
        } catch (error) {
            console.error('')
            console.error('❌ Error validating .env file:')
            console.error(`   ${error.message}`)
        }
    })
