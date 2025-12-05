import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDeployedProxiesByConfiguration } from '../../scripts/proxyFactory/getDeployedProxiesByConfiguration'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'

/*
npx hardhat getDeployedProxiesByConfiguration \
  --config-id 0x7fab0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3 \
  --config-version 1 \
  --diamond 0x00000000000000000000000000000000000015BE \
  --network genesis_validation_network_k1
*/

task(
    'getDeployedProxiesByConfiguration',
    'Get deployed proxies by configuration ID and version from ProxyFactory.'
)
    .addParam(
        'configId',
        'The configuration ID (bytes32).',
        undefined,
        types.string
    )
    .addParam(
        'configVersion',
        'The configuration version.',
        undefined,
        types.int
    )
    .addOptionalParam(
        'diamond',
        'The address of the contract',
        '0x00000000000000000000000000000000000015BE',
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                configId: string
                configVersion: number
                diamond: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            const { configId, configVersion, diamond } = taskArgs

            console.info('GET DEPLOYED PROXIES BY CONFIGURATION TASK')
            console.log(`Retrieving deployed proxies:`)
            console.log(`   Configuration ID: ${configId}`)
            console.log(`   Version:          ${configVersion}`)
            console.log(`   Diamond:          ${diamond}`)
            console.log(`   Network:          ${hre.network.name}`)

            const signatureProvider = SignatureProviderFactory.create(hre)

            const proxies = await getDeployedProxiesByConfiguration(
                hre,
                diamond,
                signatureProvider,
                configId,
                configVersion
            )

            console.log('\n📋 Deployed Proxies:')
            if (proxies.length === 0) {
                console.log('   No proxies found')
            } else {
                proxies.forEach((proxy, index) => {
                    console.log(`   [${index}] ${proxy}`)
                })
            }
        }
    )
