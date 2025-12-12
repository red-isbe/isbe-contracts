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
