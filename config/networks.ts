import { AccountManager } from './AccountManager'
import type {
    NetworkConfigWithCurve,
    HardhatNetworkConfig,
    NetworksConfig,
} from '../types/networks'

/**
 * Unified Network Configurations
 *
 * All network configurations are defined here in a single, clear location.
 * This makes it easy to understand, maintain, and modify network settings.
 */

// Environment variables for dynamic configuration
const LOCALHOST_URL = process.env.LOCALHOST_URL || 'http://172.16.240.30:8545'
const MVP_URL =
    process.env.MVP_URL ||
    'https://besu-node-non-validator-1.mvp.envs.redisbe.com'
const ARSYS_URL = process.env.ARSYS_URL || 'http://213.165.85.41:8545'
const KEPLER_URL =
    process.env.KEPLER_URL || 'https://regular.pre.iosec.io.builders:8565'
const CUSTOM_R1_URL = process.env.CUSTOM_R1_URL || 'http://127.0.0.1:8545'
const ISBE_LOCAL_DEPLOYER_URL =
    process.env.ISBE_LOCAL_DEPLOYER_URL || 'http://127.0.0.1:8545'

/**
 * Gets all network configurations
 */
export function getNetworkConfigs(): NetworksConfig {
    const accounts = AccountManager.getAccounts()
    const secp256r1Accounts = AccountManager.getSecp256r1Accounts()
    const secp256r1PrivateKeys = secp256r1Accounts.map(
        (account) => `0x${account.privateKey}`
    )

    return {
        // Local Hardhat network for development
        hardhat: {
            mining: {
                auto: true,
                interval: 0,
            },
            blockGasLimit: 30000000,
            allowUnlimitedContractSize: true,
            curve: 'secp256k1',
        } as HardhatNetworkConfig,

        // Local test network (secp256k1)
        localhost: {
            url: LOCALHOST_URL,
            chainId: 2222,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 30000000,
            curve: 'secp256k1',
        } as NetworkConfigWithCurve,

        // ISBE MVP Network (secp256k1)
        mvp: {
            url: MVP_URL,
            chainId: 2023,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: 'secp256k1',
        } as NetworkConfigWithCurve,

        // ISBE Arsys Network (secp256k1)
        arsys: {
            url: ARSYS_URL,
            chainId: 2024,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: 'secp256k1',
        } as NetworkConfigWithCurve,

        // Kepler Network (secp256k1)
        kepler: {
            url: KEPLER_URL,
            chainId: 1003,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 18800000,
            curve: 'secp256k1',
        } as NetworkConfigWithCurve,

        // Custom secp256r1 network
        customR1Network: {
            url: CUSTOM_R1_URL, // http://localhost:8545
            chainId: 2222,
            accounts: secp256r1PrivateKeys,
            gasPrice: 0,
            gas: 50000000,
            blockGasLimit: 0x1fffffffffffff,
            timeout: 60000,
            httpTimeout: 60000,
            curve: 'secp256r1',
            secp256r1Accounts,
        } as NetworkConfigWithCurve,

        isbelocaldeployer: {
            url: ISBE_LOCAL_DEPLOYER_URL,
            chainId: 2222,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800,
            curve: 'secp256k1',
        } as NetworkConfigWithCurve,
    }
}

/**
 * Gets available network names
 */
export function getAvailableNetworks(): string[] {
    return Object.keys(getNetworkConfigs())
}

/**
 * Gets networks by curve type
 */
export function getNetworksByCurve(curve: 'secp256k1' | 'secp256r1'): string[] {
    const configs = getNetworkConfigs()
    return Object.entries(configs)
        .filter(([, config]) => config.curve === curve)
        .map(([name]) => name)
}

/**
 * Gets network summary for logging
 */
export function getNetworkSummary() {
    const networks = getAvailableNetworks()
    const secp256k1Networks = getNetworksByCurve('secp256k1')
    const secp256r1Networks = getNetworksByCurve('secp256r1')
    const accounts = AccountManager.getAccounts()
    const secp256r1Accounts = AccountManager.getSecp256r1Accounts()

    return {
        totalNetworks: networks.length,
        secp256k1Networks,
        secp256r1Networks,
        accountCount: accounts.length,
        secp256r1AccountCount: secp256r1Accounts.length,
    }
}
