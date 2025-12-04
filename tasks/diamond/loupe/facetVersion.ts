import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getFacetVersion } from '../../../scripts/diamond/facetVersion'
import { SignatureProviderFactory } from '../../deployment/providers/SignatureProviderFactory'

/*
npx hardhat facetVersion \
  --diamond 0x00000000000000000000000000000000000015BE \
  --facet-key 0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3 \
  --network genesis_validation_network_k1
*/

task('facetVersion', 'Get the version of a specific facet key in the diamond.')
    .addParam(
        'diamond',
        'The address of the diamond contract.',
        undefined,
        types.string
    )
    .addParam(
        'facetKey',
        'The facet key (bytes32) to query the version for.',
        undefined,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                diamond: string
                facetKey: string
            },
            hre: HardhatRuntimeEnvironment
        ) => {
            const { diamond, facetKey } = taskArgs

            const signatureProvider = SignatureProviderFactory.create(hre)

            console.info('FACET VERSION TASK')
            console.log(`Retrieving facet version:`)
            console.log(`   Diamond: ${diamond}`)
            console.log(`   Facet Key: ${facetKey}`)
            console.log(`   Network: ${hre.network.name}`)

            const version = await getFacetVersion(
                hre,
                signatureProvider,
                diamond,
                facetKey
            )

            console.log('\n📋 Facet Version:')
            console.log(`   Version: ${version}`)
        }
    )
