/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
import { randomBytes } from 'crypto'
import { ethers } from 'ethers'
import type { Secp256r1Account } from '../types/networks'
import { ValidationError, ConfigurationError } from '../utils/errors'
import { logger } from '../utils/logger'

/**
 * AccountManager handles the creation, validation, and management of accounts
 * for both secp256k1 and secp256r1 curves used in the ISBE network.
 */
export class AccountManager {
    /**
     * Normalizes a private key by ensuring it starts with '0x'
     * @param key The private key to normalize
     * @returns The normalized private key with '0x' prefix
     */
    private static normalizePrivateKey(key: string): string {
        return key.startsWith('0x') ? key : `0x${key}`
    }

    /**
     * Validates that a private key is properly formatted (64 hex characters)
     * @param key The private key to validate
     * @returns True if the private key is valid, false otherwise
     */
    private static validatePrivateKey(key: string): boolean {
        const normalized = this.normalizePrivateKey(key)
        return /^0x[a-fA-F0-9]{64}$/.test(normalized)
    }

    /**
     * Gets accounts from environment variables or generates random keys for development
     *
     * This method:
     * 1. Checks for ACCOUNTS environment variable
     * 2. If not found, generates 10 random accounts for development
     * 3. Validates all private keys
     * 4. Returns normalized private keys
     *
     * @returns Array of validated and normalized private keys
     * @throws {ValidationError} When private keys are invalid
     * @throws {ConfigurationError} When environment configuration is incorrect
     */
    static getAccounts(): string[] {
        const accountsEnv = process.env.ACCOUNTS

        if (!accountsEnv) {
            logger.warn(
                '⚠️  ACCOUNTS not found in environment, generating random keys for development'
            )
            return Array.from(
                { length: 10 },
                () => '0x' + randomBytes(32).toString('hex')
            )
        }

        try {
            const accountsArray = accountsEnv.split(',')
            if (accountsArray.length === 0) {
                throw new ConfigurationError(
                    'ACCOUNTS environment variable is empty',
                    'ACCOUNTS'
                )
            }

            const accounts = accountsArray.map((key) =>
                this.normalizePrivateKey(key.trim())
            )

            // Validate all keys
            const invalidKeys = accounts.filter(
                (key) => !this.validatePrivateKey(key)
            )

            if (invalidKeys.length > 0) {
                throw new ValidationError(
                    'private keys',
                    `${invalidKeys.length} invalid keys`,
                    '64-character hex strings (with or without 0x prefix)'
                )
            }

            logger.success(
                `Loaded ${accounts.length} valid accounts from environment`
            )
            return accounts
        } catch (error) {
            if (
                error instanceof ValidationError ||
                error instanceof ConfigurationError
            ) {
                throw error
            }
            throw new ConfigurationError(
                `Failed to parse ACCOUNTS environment variable: ${error}`,
                'ACCOUNTS'
            )
        }
    }

    /**
     * Creates secp256r1 account objects with Ethereum address derivation
     *
     * This method:
     * 1. Gets private keys using getAccounts()
     * 2. Creates Ethereum wallets to derive addresses
     * 3. Returns account objects with address and private key (without 0x for r1)
     *
     * @returns Array of secp256r1 account objects
     */
    static getSecp256r1Accounts(): Secp256r1Account[] {
        const keys = this.getAccounts()

        try {
            return keys.map((privateKey) => {
                const wallet = new ethers.Wallet(privateKey)
                return {
                    address: wallet.address,
                    privateKey: privateKey.startsWith('0x')
                        ? privateKey.slice(2)
                        : privateKey,
                }
            })
        } catch (error) {
            throw new ConfigurationError(
                `Failed to create secp256r1 accounts: ${error}`,
                'SECP256R1_ACCOUNTS'
            )
        }
    }

    /**
     * Validates account configuration and provides detailed feedback
     * @returns Validation results with detailed information
     */
    static validateAccountConfiguration(): {
        isValid: boolean
        accountCount: number
        errors: string[]
        warnings: string[]
    } {
        const errors: string[] = []
        const warnings: string[] = []
        let accountCount = 0

        try {
            const accounts = this.getAccounts()
            accountCount = accounts.length

            if (accountCount === 0) {
                errors.push('No accounts found or configured')
            } else if (accountCount < 3) {
                warnings.push(
                    `Only ${accountCount} accounts configured. Consider using at least 3 for better testing.`
                )
            }

            // Check for duplicate accounts
            const uniqueAccounts = new Set(accounts)
            if (uniqueAccounts.size !== accounts.length) {
                warnings.push(
                    `Found ${accounts.length - uniqueAccounts.size} duplicate accounts`
                )
            }

            // Validate secp256r1 accounts can be created
            try {
                const secp256r1Accounts = this.getSecp256r1Accounts()
                if (secp256r1Accounts.length !== accountCount) {
                    errors.push(
                        'Mismatch between secp256k1 and secp256r1 account counts'
                    )
                }
            } catch (error) {
                errors.push(`Failed to create secp256r1 accounts: ${error}`)
            }
        } catch (error) {
            errors.push(`Account validation failed: ${error}`)
        }

        return {
            isValid: errors.length === 0,
            accountCount,
            errors,
            warnings,
        }
    }

    /**
     * Gets account information for a specific curve type
     * @param curve The curve type to get accounts for
     * @returns Account information for the specified curve
     */
    static getAccountsForCurve(
        curve: 'secp256k1' | 'secp256r1'
    ): string[] | Secp256r1Account[] {
        switch (curve) {
            case 'secp256k1':
                return this.getAccounts()
            case 'secp256r1':
                return this.getSecp256r1Accounts()
            default:
                throw new ValidationError(
                    'curve',
                    curve,
                    'secp256k1 or secp256r1'
                )
        }
    }
}
