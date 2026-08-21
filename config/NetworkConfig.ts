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
 * @deprecated This file is deprecated. Use the unified network configuration from './networks.ts' instead.
 *
 * This file provides backward compatibility for existing imports.
 * All network configurations are now centralized in `./networks.ts` for better maintainability.
 */

import {
    getNetworkConfigs,
    getAvailableNetworks,
    getNetworksByCurve,
    getNetworkSummary,
} from './networks'
import { AccountManager } from './AccountManager'
import type {
    NetworkConfigWithCurve,
    HardhatNetworkConfig,
    NetworksConfig,
    Secp256r1Account,
} from '../types/networks'
import { ValidationError } from '../utils/errors'
import { DEFAULT_TX_GAS_LIMIT } from '../utils/constants'
import { logger } from '../utils/logger'

/**
 * @deprecated Use the unified functions from './networks.ts' instead
 *
 * NetworkConfigManager is maintained for backward compatibility only.
 * New code should import functions directly from './networks.ts'
 */
export class NetworkConfigManager {
    private accounts: string[]
    private secp256r1Accounts: Secp256r1Account[]

    constructor() {
        logger.debug(
            'NetworkConfigManager is deprecated. Use unified network config from ./networks.ts'
        )
        this.accounts = AccountManager.getAccounts()
        this.secp256r1Accounts = AccountManager.getSecp256r1Accounts()
    }

    /**
     * @deprecated Use getNetworkConfigs() from './networks.ts'
     */
    getNetworkConfigs(): NetworksConfig {
        return getNetworkConfigs()
    }

    /**
     * @deprecated Use getNetworkConfigs() from './networks.ts' and access by key
     */
    getNetworkConfig(
        networkName: string
    ): NetworkConfigWithCurve | HardhatNetworkConfig {
        const configs = getNetworkConfigs()
        const config = configs[networkName]

        if (!config) {
            const availableNetworks = Object.keys(configs).join(', ')
            throw new ValidationError(
                'network name',
                networkName,
                `one of: ${availableNetworks}`
            )
        }

        return config
    }

    /**
     * @deprecated Use getAvailableNetworks() from './networks.ts'
     */
    getAvailableNetworks(): string[] {
        return getAvailableNetworks()
    }

    /**
     * @deprecated Use getNetworksByCurve() from './networks.ts'
     */
    getNetworksByCurve(curve: 'secp256k1' | 'secp256r1'): string[] {
        return getNetworksByCurve(curve)
    }

    /**
     * @deprecated Use getNetworkSummary() from './networks.ts'
     */
    getNetworkSummary(): {
        totalNetworks: number
        secp256k1Networks: string[]
        secp256r1Networks: string[]
        accountCount: number
        secp256r1AccountCount: number
    } {
        return getNetworkSummary()
    }

    /**
     * @deprecated Network validation is simplified in the new unified config
     */
    validateNetworkConfig(networkName: string): {
        isValid: boolean
        errors: string[]
        warnings: string[]
    } {
        const errors: string[] = []
        const warnings: string[] = []

        try {
            const config = this.getNetworkConfig(networkName)

            // Basic validation for non-hardhat networks
            if (networkName !== 'hardhat') {
                const networkConfig = config as NetworkConfigWithCurve

                if (!networkConfig.url) {
                    errors.push(`Network ${networkName} is missing URL`)
                }

                if (!networkConfig.chainId) {
                    errors.push(`Network ${networkName} is missing chain ID`)
                }

                if (
                    !networkConfig.accounts ||
                    networkConfig.accounts.length === 0
                ) {
                    errors.push(
                        `Network ${networkName} has no accounts configured`
                    )
                }

                // Validate URL format
                if (networkConfig.url) {
                    try {
                        new URL(networkConfig.url)
                    } catch {
                        errors.push(
                            `Network ${networkName} has invalid URL format: ${networkConfig.url}`
                        )
                    }
                }
            }
        } catch (error) {
            errors.push(`Failed to validate network ${networkName}: ${error}`)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * @deprecated Custom network creation should be done by extending the unified config
     */
    createCustomNetwork(
        name: string,
        config: {
            url: string
            chainId: number
            curve: 'secp256k1' | 'secp256r1'
            gasPrice?: number
            gas?: number
            blockGasLimit?: number
        }
    ): NetworkConfigWithCurve {
        logger.debug(
            'createCustomNetwork is deprecated. Extend the unified config in networks.ts instead'
        )

        // Basic implementation for backward compatibility
        const accounts =
            config.curve === 'secp256r1'
                ? this.secp256r1Accounts.map(
                      (account) => `0x${account.privateKey}`
                  )
                : this.accounts

        const networkConfig: NetworkConfigWithCurve = {
            url: config.url,
            chainId: config.chainId,
            accounts,
            gasPrice: config.gasPrice ?? 0,
            gas: config.gas ?? DEFAULT_TX_GAS_LIMIT,
            blockGasLimit: config.blockGasLimit ?? 30000000,
            curve: config.curve,
        }

        if (config.curve === 'secp256r1') {
            networkConfig.secp256r1Accounts = this.secp256r1Accounts
        }

        return networkConfig
    }
}
