import { task, types } from 'hardhat/config'

import { checkConfiguration } from '../../scripts/configMgmt/checkConfiguration'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'

/**
 npx hardhat checkConfiguration --network genesis_validation_network_k1 \
  --config-id "0x7e3880b922d76e9757625c953ece5be0530dd13a66fb3237abf2486ceb601741" \
  --config-version 1 \
  --diamond "0x00000000000000000000000000000000000015BE"

Note: This function reverts if the configuration doesn't exist.
Use version 0 to check the latest version.
 */

task(
    'checkConfiguration',
    'Validates that a specific configuration and version exist. Reverts if not found.'
)
    .addParam('configId', 'The configuration ID (bytes32)')
    .addParam('configVersion', 'The version number (use 0 for latest)')
    .addOptionalParam(
        'diamond',
        'The diamond contract address',
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
            hre
        ) => {
            const { configId, configVersion, diamond } = taskArgs

            const signatureProvider = SignatureProviderFactory.create(hre)

            console.log('\nCHECK CONFIGURATION')
            console.log('Configuration ID:', configId)
            console.log('Version:', configVersion)
            console.log('Diamond:', diamond)
            console.log('Network:', hre.network.name)

            const exists = await checkConfiguration(
                hre,
                diamond,
                signatureProvider,
                configId,
                configVersion
            )

            console.log('\n📋 Result:')
            console.log(`   Configuration exists: ${exists}`)

            if (exists) {
                console.log('✅ Configuration is valid')
            } else {
                console.log('❌ Configuration not found')
            }
        }
    )
