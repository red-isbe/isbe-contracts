import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-chai-matchers'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'solidity-docgen'
import './tasks/deployIsbeFactory'
import './tasks/deployBusinessLogic'
import './tasks/getBusinessLogicAddress'
import './tasks/getBusinessLogicVersions'
import './tasks/getBusinessLogics'
import './tasks/getIsbeFactoryFacets'

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.28',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    networks: {
        localhost: {
            url: 'http://127.0.0.1:8545',
            // No need for accounts; Hardhat provides them
        },
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
