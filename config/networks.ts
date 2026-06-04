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
const DEV_URL =
    process.env.DEV_URL ||
    'https://besu-node-validator-1-rpc.dev.cloud-w.envs.redisbe.com'
const BARE_URL =
    process.env.BARE_URL ||
    'https://besu-node-validator-bare-1-rpc.dev.aws.envs.redisbe.com/'
const ARSYS_URL = process.env.ARSYS_URL || 'http://213.165.85.41:8545'
const KEPLER_URL =
    process.env.KEPLER_URL || 'https://regular.pre.iosec.io.builders:8565'
const CUSTOM_R1_URL = process.env.CUSTOM_R1_URL || 'http://172.16.240.30:8545'
const CUSTOM_SECOND_R1_URL =
    process.env.CUSTOM_SECOND_R1_URL || 'http://127.0.0.1:8545'
const ISBE_LOCAL_DEPLOYER_URL =
    process.env.ISBE_LOCAL_DEPLOYER_URL || 'http://127.0.0.1:8545'
const ISBE_URL = process.env.ISBE_URL || 'http://localhost:8584'
const CURVE = process.env.CURVE || 'secp256k1'
const KMS_KEY_ID = process.env.KMS_KEY_ID
const kmsConfig = KMS_KEY_ID ? { kmsKeyId: KMS_KEY_ID } : {}

/**
 * Gets all network configurations
 */
export function getNetworkConfigs(): NetworksConfig {
    const accounts = AccountManager.getAccounts()
    const secp256r1Accounts = AccountManager.getSecp256r1Accounts()
    const secp256r1PrivateKeys = secp256r1Accounts.map(
        (account) => `0x${account.privateKey}`
    )

    const buildChainId = (chainId: number): number => {
        const envChainId = process.env.CHAIN_ID
        return envChainId !== undefined ? Number(envChainId) : chainId
    }

    return {
        // Local Hardhat network for development
        hardhat: {
            mining: {
                auto: true,
                interval: 0,
            },
            blockGasLimit: 30000000,
            allowUnlimitedContractSize: true,
            initialBaseFeePerGas: 0,
            gasPrice: 0,
            curve: CURVE,
        } as HardhatNetworkConfig,

        // Local test network (secp256k1)
        localhost: {
            url: LOCALHOST_URL,
            chainId: 2222,
            accounts,
            gasPrice: 0,
            gas: 10_000_0000,
            blockGasLimit: 30_000_000,
            curve: CURVE,
        } as NetworkConfigWithCurve,

        // ISBE MVP Network (secp256k1)
        dev: {
            url: DEV_URL,
            chainId: buildChainId(11073),
            accounts,
            gasPrice: 2_000,
            gas: 20_000_000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: CURVE,
            ...kmsConfig,
        } as NetworkConfigWithCurve,

        bare: {
            url: BARE_URL,
            chainId: buildChainId(10962),
            accounts: secp256r1PrivateKeys,
            gasPrice: 2_000,
            gas: 20_000_000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: CURVE,
            secp256r1Accounts,
        } as NetworkConfigWithCurve,

        isbe: {
            url: ISBE_URL,
            chainId: buildChainId(0),
            accounts: CURVE === 'secp256k1' ? accounts : secp256r1PrivateKeys,
            gasPrice: 2_000,
            gas: 20_000_000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: CURVE,
            secp256r1Accounts,
            ...kmsConfig,
        } as NetworkConfigWithCurve,

        // ISBE Arsys Network (secp256k1)
        arsys: {
            url: ARSYS_URL,
            chainId: 2024,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: CURVE,
            ...kmsConfig,
        } as NetworkConfigWithCurve,

        // Kepler Network (secp256k1)
        kepler: {
            url: KEPLER_URL,
            chainId: 1003,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 18800000,
            curve: CURVE,
            ...kmsConfig,
        } as NetworkConfigWithCurve,

        // Custom secp256r1 network
        customR1Network: {
            url: CUSTOM_R1_URL,
            chainId: 2222,
            accounts: secp256r1PrivateKeys,
            gasPrice: 0,
            gas: 20_000_000,
            blockGasLimit: 0x1e84800, // 32,000,000
            curve: CURVE,
            secp256r1Accounts,
        } as NetworkConfigWithCurve,

        // Custom second secp256r1 network call r1d1 repo:https://github.com/alastria/isbe-besu-local-deployer/tree/r1d1
        customSecondR1Network: {
            url: CUSTOM_SECOND_R1_URL, // 'http://127.0.0.1:8545'
            chainId: 2222,
            accounts: secp256r1PrivateKeys,
            gasPrice: 0,
            gas: 50000000,
            blockGasLimit: 0x1fffffffffffff,
            timeout: 60000,
            httpTimeout: 60000,
            curve: CURVE,
            secp256r1Accounts,
        } as NetworkConfigWithCurve,

        isbelocaldeployer: {
            url: ISBE_LOCAL_DEPLOYER_URL,
            chainId: 2222,
            accounts,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800,
            curve: CURVE,
        } as NetworkConfigWithCurve,

        genesis_validation_network_k1: {
            url: 'http://127.0.0.1:8545',
            accounts,
            gasPrice: 1000000001,
            curve: CURVE, // Adding the required curve property
        },

        genesis_validation_network_r1: {
            url: 'http://127.0.0.1:8545',
            accounts: secp256r1PrivateKeys,
            secp256r1Accounts,
            gasPrice: 1000000001,
            curve: CURVE, // Adding the required curve property
        },

        NO_NETWORK: {
            url: 'http://127.0.0.1:8545',
            gasPrice: 1000000001,
            accounts,
            curve: CURVE, // Adding the required curve property
        },
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
