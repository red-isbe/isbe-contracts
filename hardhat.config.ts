import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-chai-matchers'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'solidity-docgen'
import 'hardhat-gas-reporter'

// Configure dotenv globally without verbose logging
import 'dotenv/config'
import './tasks/businessLogic/deployIsbeFactory'
import './tasks/businessLogic/deployBusinessLogic'
import './tasks/businessLogic/getBusinessLogicAddress'
import './tasks/businessLogic/getBusinessLogicVersions'
import './tasks/businessLogic/getBusinessLogics'
import './tasks/diamond/loupe/getFacets'
import './tasks/diamond/loupe/getFacetAddress'
import './tasks/diamond/loupe/getFacetAddresses'
import './tasks/diamond/loupe/getFacetSelectors'
import './tasks/diamond/cut/diamondCut'
import './tasks/diamond/cut/facetUpdates'
import './tasks/diamond/cut/interfaceCut'
import './tasks/globalPause/pauseIsbe'
import './tasks/globalPause/unpauseIsbe'
import './tasks/pause/pause'
import './tasks/pause/unpause'
import './tasks/pause/isPaused'
import './tasks/access/accessControl/getRoleAdmin'
import './tasks/access/accessControl/getRoleMembers'
import './tasks/access/accessControl/getRoleMembersCount'
import './tasks/access/accessControl/getRolesByAccount'
import './tasks/access/accessControl/getRolesByAccountCount'
import './tasks/access/accessControl/grantRole'
import './tasks/access/accessControl/hasRole'
import './tasks/access/accessControl/renounceRole'
import './tasks/access/accessControl/revokeRole'
import './tasks/access/accessControl/setRoleAdmin'
import './tasks/configMgmt/facets'
import './tasks/configMgmt/facetAddress'
import './tasks/configMgmt/facetAddresses'
import './tasks/configMgmt/facetSelectors'
import './tasks/configMgmt/getConfig'
import './tasks/configMgmt/setConfig'
import './tasks/proxyFactory/deployUseCase'
import './tasks/proxyFactory/deployUseCaseTo'
import './tasks/proxyFactory/getConfigurationByProxy'
import './tasks/deployTest'
import './tasks/deployAll'
import './tasks/deployAllClean'
import './tasks/extract/byteCode'
import './tasks/extract/StorageSlots'
import './tasks/examples/curveAwareTask'
import './tasks/examples/curveAwareDeployAll'
import './tasks/secp256r1/showAccounts'
import './tasks/secp256r1/generateEnv'
import './tasks/validation/validateAccounts'
import './tasks/verification/verifyBesuDeployment'
import './tasks/verification/deploymentStatus'
import './tasks/verification/governanceRoles'

import { randomBytes } from 'crypto'
import { ethers } from 'ethers'
import {
    validateEnvAccounts,
    logValidationResults,
} from './utils/accountValidator'

// Validate .env accounts configuration
const validation = validateEnvAccounts()
if (!validation.allValid) {
    console.warn('⚠️  Account validation issues detected:')
    logValidationResults(validation)
}

// Get accounts from .env or generate defaults for secp256k1 networks
const ACCOUNTS = process.env.ACCOUNTS
    ? process.env.ACCOUNTS.split(',').map(
          (key) => '0x' + (key.startsWith('0x') ? key.slice(2) : key)
      )
    : Array.from({ length: 10 }, () => '0x' + randomBytes(32).toString('hex'))

// Get corrected secp256r1 accounts with proper Ethereum address derivation
const SECP256R1_ACCOUNT_KEYS = process.env.ACCOUNTS
    ? process.env.ACCOUNTS.split(',').map(
          (key) => '0x' + (key.startsWith('0x') ? key.slice(2) : key)
      )
    : []

const SECP256R1_ACCOUNTS = SECP256R1_ACCOUNT_KEYS.map((privateKey) => {
    const wallet = new ethers.Wallet(privateKey)
    return {
        address: wallet.address,
        privateKey: privateKey.startsWith('0x')
            ? privateKey.slice(2)
            : privateKey,
    }
})
// Custom network configuration with curve support
interface NetworkConfigWithCurve {
    url?: string
    chainId?: number
    accounts?: string[]
    gasPrice?: number
    gas?: number
    blockGasLimit?: number
    curve?: 'secp256k1' | 'secp256r1' // Custom property for curve type
    mining?: {
        auto: boolean
        interval: number
    }
    allowUnlimitedContractSize?: boolean
    secp256r1Accounts?: Array<{
        address: string
        privateKey: string
    }>
}
console.log(
    `   • Generated secp256r1 account: ${JSON.stringify(SECP256R1_ACCOUNTS, null, 2)}`
)
// Network configurations with curve information
const NETWORK_CONFIGS: { [key: string]: NetworkConfigWithCurve } = {
    hardhat: {
        mining: {
            auto: true,
            interval: 0,
        },
        blockGasLimit: 30000000,
        allowUnlimitedContractSize: true,
        curve: 'secp256k1', // Standard Ethereum curve
    },
    localhost: {
        url: 'http://172.16.240.30:8545',
        chainId: 2222,
        accounts: ACCOUNTS,
        gasPrice: 0, // Set minimum gas price to match base fee
        gas: 100000000, // Match the block gas limit
        blockGasLimit: 30000000,
        curve: 'secp256k1', // secp256k1 test network
    },
    mvp: {
        url: 'https://besu-node-non-validator-1.mvp.envs.redisbe.com',
        chainId: 2023,
        accounts: ACCOUNTS,
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 0x1e84800,
        curve: 'secp256k1', // ISBE MVP uses secp256k1
    },
    arsys: {
        url: 'http://213.165.85.41:8545',
        chainId: 2024,
        accounts: ACCOUNTS,
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 0x1e84800,
        curve: 'secp256k1', // ISBE Arsys uses secp256k1
    },
    kepler: {
        url: 'https://regular.pre.iosec.io.builders:8565',
        chainId: 1003,
        accounts: ACCOUNTS,
        gasPrice: 0,
        gas: 100000000,
        blockGasLimit: 18800000,
        curve: 'secp256k1', // Kepler uses secp256k1
    },
    // Real Hyperledger Besu secp256r1 network
    customR1Network: {
        url: 'http://localhost:8545', // Desde WSL
        chainId: 2222,
        accounts: [
            'aaa7916a0918dec3f3ec3671e19801cbdc9e00f42bc230dbd84baf6b2219aaaa',
        ], //! fake private key with balance
        gasPrice: 0,
        gas: 50000000,
        blockGasLimit: 0x1fffffffffffff,
        curve: 'secp256r1', // Custom network using secp256r1
        // Store account information for easy access
        secp256r1Accounts: [
            {
                address: '0x6b5be277e2ddf8bbf6193205cb84cca3ab8576bc', //! fake private key with balance
                privateKey:
                    'aaa7916a0918dec3f3ec3671e19801cbdc9e00f42bc230dbd84baf6b2219daaa',
            },
        ],
    },
}

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
    networks: NETWORK_CONFIGS,
    mocha: {
        timeout: 60000,
        parallel: true,
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
