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
// tasks/validation/validateAccounts.ts
import { task } from 'hardhat/config'
import {
    validateEnvAccounts,
    logValidationResults,
} from '../../utils/accountValidator'

/**
 * Task to validate that ACCOUNT_ADDRESS and ACCOUNT_PRIVATE_KEY are properly aligned
 * and that all accounts in ACCOUNTS array have correct address calculations
 */
task(
    'validate-accounts',
    'Validate that .env account configuration is properly aligned'
)
    .addFlag('fix', 'Show how to fix any alignment issues')
    .setAction(async (taskArgs) => {
        console.log('🔍 Validating .env Account Configuration...')
        console.log('')

        // Validate accounts
        const results = validateEnvAccounts()

        // Log detailed results
        logValidationResults(results)

        if (results.allValid) {
            console.log('')
            console.log('🎉 All accounts are properly configured!')
            console.log('✅ ACCOUNT_ADDRESS matches ACCOUNT_PRIVATE_KEY')
            console.log(
                '✅ All ACCOUNTS entries have correct address derivation'
            )
        } else {
            console.log('')
            console.log('❌ Configuration issues detected!')

            if (!results.primary.isValid) {
                console.log('')
                console.log('🔧 Primary Account Issue:')
                console.log(
                    '   ACCOUNT_ADDRESS and ACCOUNT_PRIVATE_KEY do not match'
                )
                console.log(`   Expected: ${results.primary.calculatedAddress}`)
                console.log(`   Found: ${results.primary.providedAddress}`)
            }

            const invalidAccounts = results.accounts.filter(
                (account) => !account.isValid
            )
            if (invalidAccounts.length > 0) {
                console.log('')
                console.log('🔧 ACCOUNTS Array Issues:')
                invalidAccounts.forEach((account, index) => {
                    console.log(`   Account ${index + 1}: ${account.error}`)
                })
            }

            if (taskArgs.fix) {
                console.log('')
                console.log('🛠 How to Fix:')
                console.log('')

                if (!results.primary.isValid) {
                    console.log(
                        '1. Update your .env file with the correct ACCOUNT_ADDRESS:'
                    )
                    console.log(
                        `   ACCOUNT_ADDRESS=${results.primary.calculatedAddress}`
                    )
                    console.log('')
                }

                console.log(
                    `2. Ensure all private keys in ACCOUNTS are valid ${results.detectedCurve} keys`
                )
                console.log(
                    '3. Use the following calculated addresses for reference:'
                )
                results.accounts.forEach((account, index) => {
                    if (account.isValid) {
                        console.log(
                            `   Account ${index + 1}: ${account.calculatedAddress}`
                        )
                    }
                })
            }
        }

        console.log('')
        console.log('📊 Summary:')
        console.log(`   Detected curve: ${results.detectedCurve.toUpperCase()}`)
        console.log(
            `   Primary account: ${results.primary.isValid ? '✅' : '❌'}`
        )
        console.log(
            `   ACCOUNTS array: ${results.accounts.length} accounts, ${results.accounts.filter((a) => a.isValid).length} valid`
        )
        console.log(
            `   Overall status: ${results.allValid ? '✅ All valid' : '❌ Issues found'}`
        )
    })

/**
 * Task to show current account configuration from .env
 */
task('show-env-accounts', 'Show current account configuration from .env')
    .addFlag('private', 'Show private keys (use with caution)')
    .setAction(async (taskArgs) => {
        console.log('📋 Current .env Account Configuration')
        console.log('')

        const accountsString = process.env.ACCOUNTS || ''
        const accountAddress = process.env.ACCOUNT_ADDRESS || ''
        const accountPrivateKey = process.env.ACCOUNT_PRIVATE_KEY || ''

        console.log('Environment Variables:')
        console.log(`  ACCOUNT_ADDRESS: ${accountAddress}`)
        console.log(
            `  ACCOUNT_PRIVATE_KEY: ${taskArgs.private ? accountPrivateKey : '***HIDDEN***'}`
        )
        console.log(
            `  ACCOUNTS: ${accountsString.split(',').length} accounts configured`
        )
        console.log('')

        if (taskArgs.private) {
            console.log(
                '⚠️  Private keys shown - ensure this is a secure environment!'
            )
            console.log('')
            const accountKeys = accountsString.split(',')
            accountKeys.forEach((key, index) => {
                console.log(`  Account ${index + 1}: 0x${key}`)
            })
        } else {
            console.log(
                '💡 Use --private flag to show private keys (development only)'
            )
        }

        console.log('')
        console.log('🔒 Security Notice:')
        console.log('   • These should be test accounts for development only')
        console.log('   • Never expose private keys in production environments')
        console.log('   • Use secure key management for production deployments')
    })
