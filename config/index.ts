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
/**
 * Unified Configuration Index
 *
 * This file provides a single entry point for all configuration-related functionality
 * in the ISBE contracts project. Import everything you need from here.
 *
 * @example Basic usage
 * ```typescript
 * import { getNetworkConfigs, ConfigManager, logger } from './config'
 *
 * // Get all networks
 * const networks = getNetworkConfigs()
 *
 * // Get configuration manager
 * const config = ConfigManager.getInstance()
 *
 * // Use debug-aware logging
 * logger.info('Starting deployment...')
 * ```
 *
 * @example Debug mode
 * ```bash
 * # Enable detailed logging
 * DEBUG=true npx hardhat compile
 * ```
 */

// Import and re-export all modules
import {
    getNetworkConfigs,
    getAvailableNetworks,
    getNetworksByCurve,
    getNetworkSummary,
} from './networks'

import {
    ConfigManager,
    type AppConfig,
    type EnvironmentConfig,
    type DeploymentConfig,
    type TestingConfig,
    type EnvironmentName,
    getEnvironmentConfig,
    getCurrentEnvironment,
} from './ConfigManager'

import { AccountManager } from './AccountManager'

import { NetworkConfigManager } from './NetworkConfig'

import { logger, isDebug, suppressLogging } from '../utils/logger'

// Re-export everything
export {
    getNetworkConfigs,
    getAvailableNetworks,
    getNetworksByCurve,
    getNetworkSummary,
    ConfigManager,
    type AppConfig,
    type EnvironmentConfig,
    type DeploymentConfig,
    type TestingConfig,
    type EnvironmentName,
    getEnvironmentConfig,
    getCurrentEnvironment,
    AccountManager,
    NetworkConfigManager,
    logger,
    isDebug,
    suppressLogging,
}

// Type definitions for external use
export type {
    NetworkConfigWithCurve,
    HardhatNetworkConfig,
    NetworksConfig,
    Secp256r1Account,
    CurveType,
} from '../types/networks'

/**
 * Quick access to commonly used configuration functions
 */
export const config = {
    /**
     * Get the configuration manager instance
     */
    manager: () => ConfigManager.getInstance(),

    /**
     * Get all network configurations
     */
    networks: () => getNetworkConfigs(),

    /**
     * Get accounts for the current environment
     */
    accounts: () => AccountManager.getAccounts(),

    /**
     * Get secp256r1 accounts
     */
    secp256r1Accounts: () => AccountManager.getSecp256r1Accounts(),

    /**
     * Check if debug mode is enabled
     */
    isDebug: () => isDebug(),

    /**
     * Get environment name
     */
    environment: () => getCurrentEnvironment(),

    /**
     * Get network summary for logging
     */
    summary: () => getNetworkSummary(),
}

/**
 * Development utilities
 */
export const dev = {
    /**
     * Enable debug logging programmatically (for testing)
     */
    enableDebug: () => {
        process.env.DEBUG = 'true'
    },

    /**
     * Disable debug logging programmatically (for testing)
     */
    disableDebug: () => {
        delete process.env.DEBUG
    },

    /**
     * Suppress all logging (useful for tests)
     */
    suppressLogging: () => suppressLogging(),

    /**
     * Validate configuration without throwing
     */
    validateConfig: () => {
        try {
            const manager = ConfigManager.getInstance()
            return manager.validateConfiguration()
        } catch (error) {
            return {
                isValid: false,
                errors: [
                    error instanceof Error ? error.message : String(error),
                ],
                warnings: [],
                summary: {
                    environment: 'unknown',
                    networksCount: 0,
                    accountsCount: 0,
                    secp256k1Networks: [],
                    secp256r1Networks: [],
                    gasLimit: 0,
                    timeout: 0,
                },
            }
        }
    },
}

/**
 * Environment variable helpers
 */
export const env = {
    /**
     * Get all supported environment variable overrides
     */
    getNetworkOverrides: () => ({
        LOCALHOST_URL: process.env.LOCALHOST_URL,
        MVP_URL: process.env.MVP_URL,
        ARSYS_URL: process.env.ARSYS_URL,
        KEPLER_URL: process.env.KEPLER_URL,
        CUSTOM_R1_URL: process.env.CUSTOM_R1_URL,
    }),

    /**
     * Check if any network overrides are active
     */
    hasNetworkOverrides: () => {
        const overrides = env.getNetworkOverrides()
        return Object.values(overrides).some((value) => value !== undefined)
    },

    /**
     * Get debug configuration
     */
    getDebugConfig: () => ({
        DEBUG: process.env.DEBUG,
        NODE_ENV: process.env.NODE_ENV,
        isDebugEnabled: isDebug(),
    }),
}

// Default export for convenience
export default {
    // Main API
    ...config,

    // Specific modules
    ConfigManager,
    AccountManager,
    logger,

    // Utilities
    dev,
    env,

    // Functions
    getNetworkConfigs,
    getAvailableNetworks,
    getNetworksByCurve,
    getNetworkSummary,
    getCurrentEnvironment,
    isDebug,
}
