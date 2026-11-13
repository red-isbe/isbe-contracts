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
    deployAllFacets,
    DEFAULT_FACETS,
} from '../../scripts/deployment/deployAllFacets'
import { resolveFacetSelection } from '../../scripts/deployment/facetSelection'
import { runDiamondUpgrade } from '../../scripts/deployment/safeDiamondUpgrade'
import { getDiamondLoupe } from '../../scripts/utils/getDiamondLoupe'

/**
 * Default diamond address for ISBE networks
 * This is the canonical address across all ISBE deployments
 */
export const DEFAULT_DIAMOND_ADDRESS =
    '0x00000000000000000000000000000000000015BE'

/**
 * Two ways of updating the governance diamond:
 *
 * Partial upgrade: only the listed facets change, the rest stay untouched.
 *   npx hardhat updateDiamondFacets --network dev --facets '["DidRegistryQueryFacet"]' --dry-run
 *   npx hardhat updateDiamondFacets --network dev --facets '["DidRegistryQueryFacet"]'
 *
 * Full replacement: every ISBE facet is redeployed and installed with facetUpdates.
 *   npx hardhat updateDiamondFacets --network dev --dry-run
 *   npx hardhat updateDiamondFacets --network dev
 *
 * Other options:
 *   --diamond 0x123...                 Diamond address (default 0x...15BE)
 *   --facet-addresses '["0x..."]'      Use facets already deployed (same order as --facets)
 *   --allow-remove                     Allow removing functions the new facets no longer declare
 *
 * Safety rules (both modes): unknown or empty --facets stops the task; the diamond can never
 * lose DiamondCut/DiamondLoupe; functions are never removed without --allow-remove; a function
 * is never moved between facets; transactions are simulated first; the final check reads the
 * real diamond and fails if it does not match.
 */
task(
    'updateDiamondFacets',
    'Upgrade the governance diamond: only the given facets (--facets) or all ISBE facets'
)
    .addOptionalParam(
        'diamond',
        'The diamond contract address (default: 0x...15BE)',
        DEFAULT_DIAMOND_ADDRESS,
        types.string
    )
    .addOptionalParam(
        'facets',
        'JSON array of facet names to upgrade. Only these facets change. Omit it for a full replacement',
        undefined,
        types.json
    )
    .addOptionalParam(
        'facetAddresses',
        'JSON array of already-deployed facet addresses to use instead of deploying new ones',
        undefined,
        types.json
    )
    .addFlag(
        'dryRun',
        'Show what would change without deploying or sending anything'
    )
    .addFlag(
        'allowRemove',
        'Allow removing functions that the new facets no longer declare'
    )
    .addFlag('skipVerification', 'Skip post-update verification')
    .addFlag('saveAddresses', 'Save deployed facet addresses to a file')
    .setAction(
        async (
            taskArgs: {
                diamond: string
                facets?: unknown
                facetAddresses?: string[]
                dryRun: boolean
                allowRemove: boolean
                skipVerification: boolean
                saveAddresses: boolean
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hre: any
        ) => {
            const facets = resolveFacetSelection(taskArgs.facets)

            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log('           ISBE Diamond Facet Update Tool')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log(`🔍 Network: ${hre.network.name}`)
            console.log(`📍 Diamond: ${taskArgs.diamond}`)
            console.log(
                facets
                    ? `📋 Partial upgrade: ${facets.join(', ')}`
                    : `📋 Full replacement: ${DEFAULT_FACETS.length} ISBE facets`
            )

            const saveDeployed = async (
                deployed: { name: string; address: string }[]
            ): Promise<void> => {
                const fs = await import('fs')
                const path = await import('path')
                const filename = `facet-addresses-${hre.network.name}-${Date.now()}.json`
                const filepath = path.join(process.cwd(), filename)
                await fs.promises.writeFile(
                    filepath,
                    JSON.stringify(
                        {
                            network: hre.network.name,
                            diamond: taskArgs.diamond,
                            timestamp: new Date().toISOString(),
                            facets: deployed,
                        },
                        null,
                        2
                    )
                )
                console.log(`💾 Facet addresses saved to: ${filepath}`)
            }

            const result = await runDiamondUpgrade(hre, {
                diamond: taskArgs.diamond,
                facets,
                facetAddresses: taskArgs.facetAddresses,
                dryRun: taskArgs.dryRun,
                allowRemove: taskArgs.allowRemove,
                skipVerification: taskArgs.skipVerification,
                // Saved as soon as the facets exist, so they can be reused with
                // --facet-addresses even if a later step fails
                onFacetsDeployed: taskArgs.saveAddresses
                    ? saveDeployed
                    : undefined,
            })

            if (result.executed) {
                console.log(
                    '\n═══════════════════════════════════════════════════════════════'
                )
                console.log('           ✅ Diamond Facet Update Complete!')
                console.log(
                    '═══════════════════════════════════════════════════════════════'
                )
            }

            return result
        }
    )

/**
 * Task to only deploy facets without updating the diamond
 *
 * npx hardhat deployFacets --network dev
 * npx hardhat deployFacets --network dev --facets '["DiamondCutAccessControlFacet"]'
 */
task('deployFacets', 'Deploy ISBE facet contracts without updating diamond')
    .addOptionalParam(
        'facets',
        'JSON array of facet names to deploy (default: all ISBE facets)',
        undefined,
        types.json
    )
    .addFlag('saveAddresses', 'Save deployed facet addresses to a file')
    .setAction(
        async (
            taskArgs: {
                facets?: unknown
                saveAddresses: boolean
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hre: any
        ) => {
            const { facets, saveAddresses } = taskArgs

            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log('           ISBE Facet Deployment Tool')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log(`🔍 Network: ${hre.network.name}`)

            // Determine facets to deploy (unknown or empty lists stop the task)
            const selection = resolveFacetSelection(facets)
            const facetNamesToDeploy: readonly string[] =
                selection ?? DEFAULT_FACETS
            console.log(
                selection
                    ? `📋 Deploying custom facet subset: ${facetNamesToDeploy.length} facets`
                    : `📋 Deploying all ISBE facets: ${facetNamesToDeploy.length} facets`
            )

            // Deploy facets
            const deploymentResult = await deployAllFacets(
                hre,
                facetNamesToDeploy
            )

            // Print deployment summary
            console.log('\n📊 Deployment Summary:')
            deploymentResult.facets.forEach((facet, idx) => {
                console.log(`   ${idx + 1}. ${facet.name}: ${facet.address}`)
            })

            // Save addresses if requested
            if (saveAddresses) {
                const fs = await import('fs')
                const path = await import('path')
                const filename = `facet-addresses-${hre.network.name}-${Date.now()}.json`
                const filepath = path.join(process.cwd(), filename)
                await fs.promises.writeFile(
                    filepath,
                    JSON.stringify(
                        {
                            network: hre.network.name,
                            timestamp: new Date().toISOString(),
                            deploymentTimeMs: deploymentResult.deploymentTimeMs,
                            facets: deploymentResult.facets,
                        },
                        null,
                        2
                    )
                )
                console.log(`\n💾 Facet addresses saved to: ${filepath}`)
            }

            console.log(
                '\n═══════════════════════════════════════════════════════════════'
            )
            console.log('           ✅ Facet Deployment Complete!')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )

            // Return addresses for programmatic use
            return deploymentResult.facetAddresses
        }
    )

/**
 * Task to show current diamond facet configuration
 *
 * npx hardhat showDiamondFacets --network dev
 * npx hardhat showDiamondFacets --network dev --diamond 0x123...
 */
task('showDiamondFacets', 'Display current facet configuration of the diamond')
    .addOptionalParam(
        'diamond',
        'The diamond contract address (default: 0x...15BE)',
        DEFAULT_DIAMOND_ADDRESS,
        types.string
    )
    .setAction(
        async (
            taskArgs: {
                diamond: string
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hre: any
        ) => {
            const { diamond } = taskArgs

            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log('           ISBE Diamond Facet Configuration')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log(`🔍 Network: ${hre.network.name}`)
            console.log(`📍 Diamond: ${diamond}`)

            try {
                const [signer] = await hre.ethers.getSigners()
                const diamondLoupe = await getDiamondLoupe(diamond, signer)
                const facets = await diamondLoupe.facets()

                console.log(`\n📊 Current Facets: ${facets.length}`)
                console.log(
                    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                )

                for (let i = 0; i < facets.length; i++) {
                    const facet = facets[i]
                    console.log(
                        `\n${i + 1}. Facet Address: ${facet.facetAddress}`
                    )
                    console.log(
                        `   Selectors (${facet.functionSelectors.length}):`
                    )
                    facet.functionSelectors
                        .slice(0, 5)
                        .forEach((selector: string) => {
                            console.log(`      - ${selector}`)
                        })
                    if (facet.functionSelectors.length > 5) {
                        console.log(
                            `      ... and ${facet.functionSelectors.length - 5} more`
                        )
                    }
                }

                console.log(
                    '\n═══════════════════════════════════════════════════════════════'
                )
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)
                console.error(
                    `\n❌ Failed to read diamond facets: ${errorMessage}`
                )
                throw error
            }
        }
    )
