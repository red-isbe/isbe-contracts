#!/usr/bin/env npx ts-node

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
 * Example: Using the Unified Configuration System
 *
 * This script demonstrates how to use the new unified configuration index
 * for accessing networks, accounts, and other configuration data.
 */

// Import from the unified configuration index
import {
    getNetworkConfigs,
    ConfigManager,
    logger,
    config,
    dev,
    env,
} from '../config'

// Alternative: use default import for everything
import configDefault from '../config'

async function main() {
    console.log('🔧 ISBE Unified Configuration Demo\n')

    // Method 1: Direct imports
    console.log('📍 Method 1: Direct Function Imports')
    const networks = getNetworkConfigs()
    console.log(`Networks available: ${Object.keys(networks).join(', ')}`)

    const manager = ConfigManager.getInstance()
    console.log(`Environment: ${manager.getEnvironment()}`)

    // Method 2: Using config object for quick access
    console.log('\n📍 Method 2: Config Object Quick Access')
    const accounts = config.accounts()
    console.log(`Accounts loaded: ${accounts.length}`)

    const summary = config.summary()
    console.log(
        `Network summary: ${summary.totalNetworks} networks, ${summary.accountCount} accounts`
    )

    // Method 3: Using default import
    console.log('\n📍 Method 3: Default Import')
    const networksFromDefault = configDefault.getNetworkConfigs()
    console.log(
        `Networks from default: ${Object.keys(networksFromDefault).length}`
    )

    // Method 4: Development utilities
    console.log('\n📍 Method 4: Development Utilities')
    const validation = dev.validateConfig()
    console.log(`Configuration valid: ${validation.isValid}`)

    if (!validation.isValid) {
        console.log('Errors:', validation.errors)
    }

    // Method 5: Environment variable helpers
    console.log('\n📍 Method 5: Environment Variables')
    const overrides = env.getNetworkOverrides()
    const hasOverrides = env.hasNetworkOverrides()
    console.log(`Has network overrides: ${hasOverrides}`)

    if (hasOverrides) {
        console.log('Active overrides:', overrides)
    }

    const debugConfig = env.getDebugConfig()
    console.log(`Debug enabled: ${debugConfig.isDebugEnabled}`)

    // Method 6: Logger demonstration
    console.log('\n📍 Method 6: Debug-Aware Logging')
    logger.info('This will only show in DEBUG mode')
    logger.debug('This is debug information')
    logger.success('Configuration demo completed successfully')

    // Show network details in debug mode
    if (config.isDebug()) {
        console.log('\n🔍 Debug Mode: Network Details')
        Object.entries(networks).forEach(([name, networkConfig]) => {
            if ('chainId' in networkConfig) {
                // This is a regular network (not hardhat)
                console.log(`${name}:`, {
                    chainId: networkConfig.chainId,
                    curve: networkConfig.curve,
                    accounts: networkConfig.accounts?.length || 0,
                })
            } else {
                // This is hardhat network
                console.log(`${name}:`, {
                    type: 'hardhat',
                    curve: networkConfig.curve,
                    blockGasLimit: networkConfig.blockGasLimit,
                })
            }
        })
    }

    console.log('\n✅ Demo completed!')
    console.log('💡 Try running with DEBUG=true to see more details')
}

// Run the demo
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Demo failed:', error)
        process.exit(1)
    })
}
