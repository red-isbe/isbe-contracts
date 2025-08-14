module.exports = {
    skipFiles: ['testwrapper/'],
    mocha: {
        timeout: 120000,
        parallel: false,
    },
    configureYulOptimizer: true,
    measureStatementCoverage: true,
    measureFunctionCoverage: true,
    measureBranchCoverage: true,
    measureLineCoverage: true,
    istanbulReporter: ['html', 'lcov', 'text', 'json'],
    providerOptions: {
        mnemonic: 'test test test test test test test test test test test junk',
        gasLimit: 0xfffffffffff,
        gasPrice: 0x01,
    },
    networks: {
        coverage: {
            host: 'localhost',
            network_id: '*',
            port: 8555,
            gas: 0xfffffffffff,
            gasPrice: 0x01,
        },
    },
}
