import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-chai-matchers'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'solidity-docgen'

const config: HardhatUserConfig = {
    solidity: '0.8.28',
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
