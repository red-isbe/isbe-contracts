import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-chai-matchers'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'solidity-docgen'
import 'hardhat-gas-reporter'
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
import './tasks/proxyFactory/getConfigurationByProxy'
import './tasks/deployTest'
import './tasks/deployAll'
import './tasks/extract/byteCode'
import './tasks/extract/StorageSlots'

import { randomBytes } from 'crypto'

const ACCOUNTS = (
    process.env.ACCOUNTS ?? randomBytes(32).toString('hex')
).split(',')
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
    networks: {
        hardhat: {
            mining: {
                auto: true,
                interval: 0,
            },
            blockGasLimit: 30000000,
            allowUnlimitedContractSize: true,
        },
        localhost: {
            url: 'http://127.0.0.1:8545',
            // No need for accounts; Hardhat provides them
        },
        mvp: {
            url: 'https://besu-node-non-validator-1.mvp.envs.redisbe.com',
            chainId: 2023,
            accounts: ACCOUNTS,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800,
        },
        arsys: {
            url: 'http://213.165.85.41:8545',
            chainId: 2024,
            accounts: ACCOUNTS,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 0x1e84800,
        },
        kepler: {
            url: 'https://regular.pre.iosec.io.builders:8565',
            chainId: 1003,
            accounts: ACCOUNTS,
            gasPrice: 0,
            gas: 100000000,
            blockGasLimit: 18800000,
        },
    },
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
