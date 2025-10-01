// utils/accountValidator.ts
import { keyPairFromPrivateKey } from './secp256r1Utils'
import { ethers } from 'ethers'
import * as fs from 'fs'
import * as path from 'path'

export interface AccountValidationResult {
    isValid: boolean
    providedAddress: string
    calculatedAddress: string
    privateKey: string
    error?: string
}

/**
 * Validate that an address matches the given private key for secp256k1
 */
export function validateSecp256k1Account(
    privateKey: string,
    expectedAddress: string
): AccountValidationResult {
    try {
        const cleanPrivateKey = privateKey.startsWith('0x')
            ? privateKey
            : '0x' + privateKey
        const cleanExpectedAddress = expectedAddress.toLowerCase()

        // Use ethers to derive address from private key
        const wallet = new ethers.Wallet(cleanPrivateKey)
        const calculatedAddress = wallet.address.toLowerCase()

        const isValid = calculatedAddress === cleanExpectedAddress

        return {
            isValid,
            providedAddress: expectedAddress,
            calculatedAddress: wallet.address,
            privateKey: cleanPrivateKey,
            error: isValid
                ? undefined
                : `Address mismatch: expected ${expectedAddress}, got ${wallet.address}`,
        }
    } catch (error) {
        return {
            isValid: false,
            providedAddress: expectedAddress,
            calculatedAddress: 'N/A',
            privateKey: privateKey,
            error: `Validation failed: ${error.message}`,
        }
    }
}

/**
 * Validate that an address matches the given private key for secp256r1
 */
export function validateSecp256r1Account(
    privateKey: string,
    expectedAddress: string
): AccountValidationResult {
    try {
        // Remove 0x prefix if present
        const cleanPrivateKey = privateKey.startsWith('0x')
            ? privateKey.slice(2)
            : privateKey
        const cleanExpectedAddress = expectedAddress.toLowerCase()

        // Generate key pair from private key
        const keyPair = keyPairFromPrivateKey(cleanPrivateKey)
        const calculatedAddress = keyPair.address.toLowerCase()

        const isValid = calculatedAddress === cleanExpectedAddress

        return {
            isValid,
            providedAddress: expectedAddress,
            calculatedAddress: keyPair.address,
            privateKey: '0x' + cleanPrivateKey,
            error: isValid
                ? undefined
                : `Address mismatch: expected ${expectedAddress}, got ${keyPair.address}`,
        }
    } catch (error) {
        return {
            isValid: false,
            providedAddress: expectedAddress,
            calculatedAddress: 'N/A',
            privateKey: privateKey,
            error: `Validation failed: ${error.message}`,
        }
    }
}

/**
 * Detect curve type from .env file comments or use smart detection
 */
function detectCurveFromEnv(): 'secp256k1' | 'secp256r1' {
    // Check if .env file has curve information in comments

    try {
        const envPath = path.join(process.cwd(), '.env')
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8')
            if (envContent.includes('; Curve: SECP256K1')) return 'secp256k1'
            if (envContent.includes('; Curve: SECP256R1')) return 'secp256r1'
        }
    } catch {
        // Fall back to smart detection if file reading fails
    }

    // Smart detection: try secp256k1 first (more common), then secp256r1
    const accountPrivateKey = process.env.ACCOUNT_PRIVATE_KEY
    const accountAddress = process.env.ACCOUNT_ADDRESS

    if (!accountPrivateKey || !accountAddress) {
        return 'secp256k1' // Default assumption
    }

    try {
        // Test secp256k1 first
        const wallet = new ethers.Wallet(
            accountPrivateKey.startsWith('0x')
                ? accountPrivateKey
                : '0x' + accountPrivateKey
        )
        if (wallet.address.toLowerCase() === accountAddress.toLowerCase()) {
            return 'secp256k1'
        }
    } catch {
        // secp256k1 failed, might be secp256r1
    }

    try {
        // Test secp256r1
        const cleanPrivateKey = accountPrivateKey.startsWith('0x')
            ? accountPrivateKey.slice(2)
            : accountPrivateKey
        const keyPair = keyPairFromPrivateKey(cleanPrivateKey)
        if (keyPair.address.toLowerCase() === accountAddress.toLowerCase()) {
            return 'secp256r1'
        }
    } catch {
        // Both failed, default to secp256k1
    }

    return 'secp256k1' // Default fallback
}

/**
 * Validate all accounts from ACCOUNTS string and ACCOUNT_ADDRESS/ACCOUNT_PRIVATE_KEY
 */
export function validateEnvAccounts(): {
    primary: AccountValidationResult
    accounts: AccountValidationResult[]
    allValid: boolean
    detectedCurve: 'secp256k1' | 'secp256r1'
} {
    const accountsString = process.env.ACCOUNTS || ''
    const accountAddress = process.env.ACCOUNT_ADDRESS || ''
    const accountPrivateKey = process.env.ACCOUNT_PRIVATE_KEY || ''

    // Detect which curve we're using
    const detectedCurve = detectCurveFromEnv()

    // Validate primary account using appropriate curve
    const primaryValidation =
        detectedCurve === 'secp256k1'
            ? validateSecp256k1Account(accountPrivateKey, accountAddress)
            : validateSecp256r1Account(accountPrivateKey, accountAddress)

    // Validate all accounts in ACCOUNTS array
    const accountKeys = accountsString
        .split(',')
        .filter((key) => key.trim() !== '')
    const accountValidations: AccountValidationResult[] = []

    // Calculate addresses for all keys and validate they're consistent
    accountKeys.forEach((key) => {
        try {
            if (detectedCurve === 'secp256k1') {
                const wallet = new ethers.Wallet(
                    key.startsWith('0x') ? key : '0x' + key
                )
                accountValidations.push({
                    isValid: true,
                    providedAddress: wallet.address,
                    calculatedAddress: wallet.address,
                    privateKey: wallet.privateKey,
                })
            } else {
                const keyPair = keyPairFromPrivateKey(key)
                accountValidations.push({
                    isValid: true,
                    providedAddress: keyPair.address,
                    calculatedAddress: keyPair.address,
                    privateKey: '0x' + key,
                })
            }
        } catch (error) {
            accountValidations.push({
                isValid: false,
                providedAddress: 'N/A',
                calculatedAddress: 'N/A',
                privateKey: '0x' + key,
                error: error.message,
            })
        }
    })

    const allValid =
        primaryValidation.isValid &&
        accountValidations.every((validation) => validation.isValid)

    return {
        primary: primaryValidation,
        accounts: accountValidations,
        allValid,
        detectedCurve,
    }
}

/**
 * Log validation results in a formatted way
 */
export function logValidationResults(
    results: ReturnType<typeof validateEnvAccounts>
): void {
    console.log('=== Account Validation Results ===')
    console.log(`Detected Curve: ${results.detectedCurve.toUpperCase()}`)
    console.log('')

    // Primary account validation
    console.log('Primary Account (ACCOUNT_ADDRESS & ACCOUNT_PRIVATE_KEY):')
    console.log(
        `  Status: ${results.primary.isValid ? '✅ Valid' : '❌ Invalid'}`
    )
    console.log(`  Provided Address: ${results.primary.providedAddress}`)
    console.log(`  Calculated Address: ${results.primary.calculatedAddress}`)
    console.log(`  Private Key: ${results.primary.privateKey}`)
    if (results.primary.error) {
        console.log(`  Error: ${results.primary.error}`)
    }
    console.log('')

    // All accounts validation
    console.log('ACCOUNTS Array Validation:')
    results.accounts.forEach((account, index) => {
        console.log(`  Account ${index + 1}: ${account.isValid ? '✅' : '❌'}`)
        console.log(`    Expected: ${account.providedAddress}`)
        console.log(`    Calculated: ${account.calculatedAddress}`)
        if (account.error) {
            console.log(`    Error: ${account.error}`)
        }
    })
    console.log('')

    console.log(
        `Overall Status: ${results.allValid ? '✅ All accounts valid' : '❌ Some accounts invalid'}`
    )
}

/**
 * Get secp256r1 accounts from environment variables
 */
export function getSecp256r1AccountsFromEnv(): Array<{
    privateKey: string
    publicKey: string
    compressedPublicKey: string
    address: string
}> {
    const accountsString = process.env.ACCOUNTS || ''
    const accountKeys = accountsString
        .split(',')
        .filter((key) => key.trim() !== '')

    return accountKeys.map((key) => {
        return keyPairFromPrivateKey(key.trim())
    })
}
