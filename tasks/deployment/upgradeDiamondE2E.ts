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
import {
    upgradeDiamondE2E,
    DEFAULT_DIAMOND_ADDRESS as E2E_DIAMOND,
} from '../../scripts/deployment/upgradeDiamondE2E'
import {
    checkFacetVersions,
    printVersionResults,
    DEFAULT_DIAMOND_ADDRESS as CHECK_DIAMOND,
} from '../../scripts/deployment/checkFacetVersions'
import { DEFAULT_FACETS } from '../../scripts/deployment/deployAllFacets'

/**
 * Default diamond address for ISBE networks
 */
const DEFAULT_DIAMOND = E2E_DIAMOND || CHECK_DIAMOND

/**
 * npx hardhat upgradeDiamondE2E --network isbelocaldeployer
 * npx hardhat upgradeDiamondE2E --network customSecondR1Network --dry-run
 * npx hardhat upgradeDiamondE2E --network dev --facets '["DiamondCutAccessControlFacet"]'
 * npx hardhat checkFacetVersions --network isbelocaldeployer
 */
task(
    'upgradeDiamondE2E',
    'End-to-end diamond upgrade: deploy facets, update diamond, verify'
)
    .addOptionalParam(
        'diamond',
        'The diamond contract address (default: 0x...15BE)',
        DEFAULT_DIAMOND,
        types.string
    )
    .addOptionalParam(
        'facets',
        'JSON array of facet names to deploy (default: all ISBE facets)',
        undefined,
        types.json
    )
    .addFlag('dryRun', 'Show what would be done without executing transactions')
    .addFlag('skipVerification', 'Skip post-update verification')
    .addFlag('saveAddresses', 'Save deployed facet addresses to a file')
    .addFlag('checkVersions', 'Check facet versions before and after upgrade')
    .setAction(
        async (
            taskArgs: {
                diamond: string
                facets?: string[]
                dryRun: boolean
                skipVerification: boolean
                saveAddresses: boolean
                checkVersions: boolean
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hre: any
        ) => {
            const {
                diamond,
                facets,
                dryRun,
                skipVerification,
                saveAddresses,
                checkVersions,
            } = taskArgs

            // Validate diamond address
            if (!diamond.startsWith('0x') || diamond.length !== 42) {
                throw new Error(`Invalid diamond address: ${diamond}`)
            }

            // Validate facets if provided
            let facetNames: string[] | undefined
            if (facets && facets.length > 0) {
                const unknown = facets.filter(
                    (f) =>
                        !DEFAULT_FACETS.includes(
                            f as (typeof DEFAULT_FACETS)[number]
                        )
                )
                if (unknown.length > 0) {
                    console.warn(`⚠️  Unknown facets: ${unknown.join(', ')}`)
                }
                facetNames = facets.filter((f) =>
                    DEFAULT_FACETS.includes(
                        f as (typeof DEFAULT_FACETS)[number]
                    )
                )
            }

            await upgradeDiamondE2E(hre, {
                diamond,
                facets: facetNames,
                dryRun,
                skipVerification,
                saveAddresses,
                checkVersions,
            })
        }
    )

/**
 * Task to check facet versions on a deployed diamond
 *
 * npx hardhat checkFacetVersions --network isbelocaldeployer
 * npx hardhat checkFacetVersions --network dev --diamond 0x123...
 */
task(
    'checkFacetVersions',
    'Check deployed facet versions against code versions'
)
    .addOptionalParam(
        'diamond',
        'The diamond contract address (default: 0x...15BE)',
        DEFAULT_DIAMOND,
        types.string
    )
    .addOptionalParam(
        'facets',
        'JSON array of facet names to check (default: all known facets)',
        undefined,
        types.json
    )
    .setAction(
        async (
            taskArgs: {
                diamond: string
                facets?: string[]
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hre: any
        ) => {
            const { diamond, facets } = taskArgs

            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log('           FACET VERSION CHECK')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log(`📍 Diamond: ${diamond}`)
            console.log(`🌐 Network: ${hre.network.name}`)

            const result = await checkFacetVersions(hre, diamond, facets)
            printVersionResults(result)

            return result
        }
    )
