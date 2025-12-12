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
import { AccountManager } from './AccountManager'
import { getNetworkSummary } from './networks'
import { ValidationError, ConfigurationError } from '../utils/errors'
import { logger } from '../utils/logger'

/**
 * Environment-specific configuration settings
 */
export interface EnvironmentConfig {
    gasLimit: number
    gasPrice: number
    timeout: number
    retries: number
    confirmations: number
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error'
        enableColors: boolean
        enableTimestamps: boolean
    }
}

/**
 * Deployment-specific configuration
 */
export interface DeploymentConfig {
    gasLimit: number
    timeout: number
    retries: number
    confirmations: number
}

/**
 * Testing configuration
 */
export interface TestingConfig {
    timeout: number
    parallel: boolean
    coverage: {
        threshold: {
            lines: number
            branches: number
            functions: number
            statements: number
        }
    }
}

/**
 * Complete application configuration
 */
export interface AppConfig {
    accounts: string[]
    deployment: DeploymentConfig
    testing: TestingConfig
    environment: EnvironmentConfig
}

/**
 * Environment-specific configurations
 */
const environments: Record<string, EnvironmentConfig> = {
    development: {
        gasLimit: 30000000,
        gasPrice: 0,
        timeout: 60000,
        retries: 1,
        confirmations: 1,
        logging: {
            level: 'debug',
            enableColors: true,
            enableTimestamps: true,
        },
    },
    testing: {
        gasLimit: 30000000,
        gasPrice: 1,
        timeout: 60000,
        retries: 3,
        confirmations: 1,
        logging: {
            level: 'warn',
            enableColors: false,
            enableTimestamps: false,
        },
    },
    production: {
        gasLimit: 8000000,
        gasPrice: 20000000000, // 20 gwei
        timeout: 300000,
        retries: 5,
        confirmations: 3,
        logging: {
            level: 'info',
            enableColors: false,
            enableTimestamps: true,
        },
    },
} as const

export type EnvironmentName = keyof typeof environments

/**
 * ConfigManager provides centralized configuration management for the ISBE project.
 * It handles network configurations, account management, and environment-specific settings.
 */
export class ConfigManager {
    private static instance: ConfigManager
    private config: AppConfig
    private environment: EnvironmentName

    private constructor() {
        this.environment = this.getCurrentEnvironment()
        this.config = this.loadConfig()
    }

    /**
     * Gets the singleton instance of ConfigManager
     * @returns ConfigManager instance
     */
    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager()
        }
        return ConfigManager.instance
    }

    /**
     * Loads and validates the complete application configuration
     * @returns Complete application configuration
     * @throws {ConfigurationError} When configuration loading fails
     */
    private loadConfig(): AppConfig {
        try {
            logger.config(
                `Loading configuration for environment: ${this.environment}`
            )

            // Get environment config directly from the environments object
            const environmentConfig = environments[this.environment]
            if (!environmentConfig) {
                throw new ValidationError(
                    'environment',
                    this.environment,
                    `one of: ${Object.keys(environments).join(', ')}`
                )
            }

            return {
                accounts: this.validateAccounts(),
                deployment: {
                    gasLimit: environmentConfig.gasLimit,
                    timeout: environmentConfig.timeout,
                    retries: environmentConfig.retries,
                    confirmations: environmentConfig.confirmations,
                },
                testing: {
                    timeout: 60000,
                    parallel: false,
                    coverage: {
                        threshold: {
                            lines: 100,
                            branches: 100,
                            functions: 100,
                            statements: 100,
                        },
                    },
                },
                environment: environmentConfig,
            }
        } catch (error) {
            throw new ConfigurationError(
                `Configuration loading failed: ${error}`,
                'APP_CONFIG'
            )
        }
    }

    /**
     * Validates and returns account configurations
     * @returns Validated accounts
     */
    private validateAccounts(): string[] {
        const validation = AccountManager.validateAccountConfiguration()

        if (!validation.isValid) {
            logger.error('❌ Account configuration errors:', validation.errors)
            throw new ValidationError(
                'account configuration',
                'invalid accounts',
                'valid private keys. Errors: ' + validation.errors.join(', ')
            )
        }

        if (validation.warnings.length > 0) {
            logger.warn(
                '⚠️  Account configuration warnings:',
                validation.warnings
            )
        }

        const accounts = AccountManager.getAccounts()
        logger.success(`Validated ${accounts.length} accounts`)
        return accounts
    }

    /**
     * Gets the current environment name
     * @returns Current environment name
     */
    private getCurrentEnvironment(): EnvironmentName {
        const env = process.env.NODE_ENV as EnvironmentName
        return env in environments ? env : 'development'
    }

    // Public API methods

    /**
     * Gets account configurations
     * @returns Account private keys
     */
    getAccounts(): string[] {
        return this.config.accounts
    }

    /**
     * Gets deployment configuration
     * @returns Deployment configuration
     */
    getDeploymentConfig(): DeploymentConfig {
        return this.config.deployment
    }

    /**
     * Gets testing configuration
     * @returns Testing configuration
     */
    getTestingConfig(): TestingConfig {
        return this.config.testing
    }

    /**
     * Gets environment configuration
     * @returns Environment configuration
     */
    getEnvironmentConfig(): EnvironmentConfig {
        return this.config.environment
    }

    /**
     * Gets current environment name
     * @returns Environment name
     */
    getEnvironment(): EnvironmentName {
        return this.environment
    }

    /**
     * Gets complete application configuration
     * @returns Complete application configuration
     */
    getConfig(): AppConfig {
        return this.config
    }

    /**
     * Gets configuration summary for logging/debugging
     * @returns Configuration summary
     */
    getConfigSummary(): {
        environment: string
        networksCount: number
        accountsCount: number
        secp256k1Networks: string[]
        secp256r1Networks: string[]
        gasLimit: number
        timeout: number
    } {
        const networkSummary = getNetworkSummary()

        return {
            environment: this.environment,
            networksCount: networkSummary.totalNetworks,
            accountsCount: networkSummary.accountCount,
            secp256k1Networks: networkSummary.secp256k1Networks,
            secp256r1Networks: networkSummary.secp256r1Networks,
            gasLimit: this.config.deployment.gasLimit,
            timeout: this.config.deployment.timeout,
        }
    }

    /**
     * Validates the entire configuration and provides detailed feedback
     * @returns Validation results
     */
    validateConfiguration(): {
        isValid: boolean
        errors: string[]
        warnings: string[]
        summary: ReturnType<ConfigManager['getConfigSummary']>
    } {
        const errors: string[] = []
        const warnings: string[] = []

        try {
            // Validate accounts
            const accountValidation =
                AccountManager.validateAccountConfiguration()
            if (!accountValidation.isValid) {
                errors.push(...accountValidation.errors)
            }
            warnings.push(...accountValidation.warnings)

            // Network validation is now handled by the unified network config

            // Validate environment settings
            const envConfig = this.config.environment
            if (envConfig.gasLimit <= 0) {
                errors.push('Invalid gas limit: must be positive')
            }
            if (envConfig.timeout <= 0) {
                errors.push('Invalid timeout: must be positive')
            }
        } catch (error) {
            errors.push(`Configuration validation failed: ${error}`)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            summary: this.getConfigSummary(),
        }
    }

    /**
     * Reloads the configuration (useful for testing or dynamic config changes)
     */
    reload(): void {
        this.environment = this.getCurrentEnvironment()
        this.config = this.loadConfig()
        logger.info('🔄 Configuration reloaded')
    }
}

// Convenience functions for backward compatibility
export function getEnvironmentConfig(env: EnvironmentName): EnvironmentConfig {
    const config = environments[env]
    if (!config) {
        throw new ValidationError(
            'environment',
            env,
            `one of: ${Object.keys(environments).join(', ')}`
        )
    }
    return config
}

export function getCurrentEnvironment(): EnvironmentName {
    const env = process.env.NODE_ENV as EnvironmentName
    return env in environments ? env : 'development'
}
