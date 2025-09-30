import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-chai-matchers'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'solidity-docgen'
import 'hardhat-gas-reporter'

// Configure dotenv globally without verbose logging
import 'dotenv/config'

// Import unified configuration and task utilities
import { getNetworkConfigs, ConfigManager, logger } from './config'

// Register all tasks with Hardhat CLI in a single import
// This replaces the many individual task imports with a consolidated approach
import './tasks/register'
import './tasks/client/registerFilter'
import './tasks/client/getFiltersLength'
import './tasks/client/getFiltersByPage'
import './tasks/client/isFilterRegistered'

// Initialize configuration management
const configManager = ConfigManager.getInstance()

// Validate configuration and log results
const configValidation = configManager.validateConfiguration()
if (!configValidation.isValid) {
    logger.error('❌ Configuration validation failed:')
    configValidation.errors.forEach((error) => logger.error(`  - ${error}`))
    logger.warn('⚠️  Continuing with potentially invalid configuration')
}

if (configValidation.warnings.length > 0) {
    logger.warn('⚠️  Configuration warnings:')
    configValidation.warnings.forEach((warning) =>
        logger.warn(`  - ${warning}`)
    )
}

// Log configuration summary (respects debug mode)
const summary = configValidation.summary
logger.summary('Configuration Summary', {
    environment: summary.environment,
    networksCount: summary.networksCount,
    secp256k1Networks: summary.secp256k1Networks,
    secp256r1Networks: summary.secp256r1Networks,
    accountsCount: summary.accountsCount,
    gasLimit: summary.gasLimit,
    timeout: `${summary.timeout}ms`,
})

// Get network configurations from unified config
const networkConfigs = getNetworkConfigs()

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.28',
        settings: {
            evmVersion: 'istanbul',
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    networks: networkConfigs,
    mocha: {
        timeout: configManager.getTestingConfig().timeout,
        parallel: configManager.getTestingConfig().parallel,
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts',
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
    },
    docgen: {
        outputDir: 'docs/generated-temp',
        pages: 'items',
        exclude: ['testwrapper'],
        collapseNewlines: true,
    },
}

export default config
