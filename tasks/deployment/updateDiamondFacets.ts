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
import { SignatureProviderFactory } from './providers/SignatureProviderFactory'
import { ISignatureProvider } from './providers/ISignatureProvider'
import { facetUpdates } from '../../scripts/diamond/cut/facetUpdates'
import {
    deployAllFacets,
    DEFAULT_FACETS,
    validateFacetList,
    type DeployAllFacetsResult,
} from '../../scripts/deployment/deployAllFacets'
import { getDiamondLoupe } from '../../scripts/utils/getDiamondLoupe'
import { NetworkConfigWithCurve } from '../../types/hardhat'

/**
 * Default diamond address for ISBE networks
 * This is the canonical address across all ISBE deployments
 */
export const DEFAULT_DIAMOND_ADDRESS =
    '0x00000000000000000000000000000000000015BE'

/**
 * npx hardhat updateDiamondFacets --network dev
 * npx hardhat updateDiamondFacets --network dev --diamond 0x123...
 * npx hardhat updateDiamondFacets --network dev --dry-run
 * npx hardhat updateDiamondFacets --network dev --facets '["DiamondCutAccessControlFacet","DiamondLoupeFacet"]'
 * npx hardhat updateDiamondFacets --network dev --facet-addresses '["0x...","0x..."]'
 */
task(
    'updateDiamondFacets',
    'Deploy all ISBE facets and update the diamond contract'
)
    .addOptionalParam(
        'diamond',
        'The diamond contract address (default: 0x...15BE)',
        DEFAULT_DIAMOND_ADDRESS,
        types.string
    )
    .addOptionalParam(
        'facets',
        'JSON array of facet names to deploy (default: all ISBE facets)',
        undefined,
        types.json
    )
    .addOptionalParam(
        'facetAddresses',
        'JSON array of already-deployed facet addresses to use instead of deploying new ones',
        undefined,
        types.json
    )
    .addFlag('dryRun', 'Show what would be done without executing transactions')
    .addFlag('skipVerification', 'Skip post-update verification')
    .addFlag('saveAddresses', 'Save deployed facet addresses to a file')
    .setAction(
        async (
            taskArgs: {
                diamond: string
                facets?: string[]
                facetAddresses?: string[]
                dryRun: boolean
                skipVerification: boolean
                saveAddresses: boolean
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            hre: any
        ) => {
            const {
                diamond,
                facets,
                facetAddresses,
                dryRun,
                skipVerification,
                saveAddresses,
            } = taskArgs

            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log('           ISBE Diamond Facet Update Tool')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log(`🔍 Network: ${hre.network.name}`)
            console.log(`📍 Diamond: ${diamond}`)

            // Check curve type
            const networkConfig = hre.config.networks[
                hre.network.name
            ] as NetworkConfigWithCurve
            const isSecp256r1 = networkConfig.curve === 'secp256r1'

            if (isSecp256r1) {
                console.log(
                    '🔐 secp256r1 network detected - using enhanced signature handling'
                )
            }

            // Determine facets to use
            let facetNamesToDeploy: readonly string[] = DEFAULT_FACETS
            if (facets && facets.length > 0) {
                const validation = validateFacetList(facets)
                if (validation.unknown.length > 0) {
                    console.warn(
                        `⚠️  Unknown facets specified: ${validation.unknown.join(', ')}`
                    )
                }
                facetNamesToDeploy = facets.filter((f) =>
                    DEFAULT_FACETS.includes(
                        f as (typeof DEFAULT_FACETS)[number]
                    )
                )
                console.log(
                    `📋 Using custom facet subset: ${facetNamesToDeploy.length} facets`
                )
            }

            // Validate diamond address
            if (!diamond.startsWith('0x') || diamond.length !== 42) {
                throw new Error(`Invalid diamond address: ${diamond}`)
            }

            let finalFacetAddresses: string[]

            // ============================================================
            // PHASE 1: Deploy Facets (or use provided addresses)
            // ============================================================
            console.log(
                '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )
            console.log('PHASE 1: FACET DEPLOYMENT')
            console.log(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )

            if (facetAddresses && facetAddresses.length > 0) {
                console.log(
                    '📦 Using provided facet addresses (skipping deployment)'
                )
                if (facetAddresses.length !== facetNamesToDeploy.length) {
                    throw new Error(
                        `Mismatch: ${facetNamesToDeploy.length} facet names but ${facetAddresses.length} addresses provided`
                    )
                }
                finalFacetAddresses = facetAddresses

                // Validate addresses
                for (let i = 0; i < finalFacetAddresses.length; i++) {
                    const addr = finalFacetAddresses[i]
                    if (!addr.startsWith('0x') || addr.length !== 42) {
                        throw new Error(
                            `Invalid facet address at index ${i}: ${addr}`
                        )
                    }
                }

                console.log(
                    `   ✅ Using ${finalFacetAddresses.length} pre-deployed facet addresses`
                )
            } else {
                if (dryRun) {
                    console.log(
                        '🔍 DRY RUN: Would deploy the following facets:'
                    )
                    facetNamesToDeploy.forEach((name, idx) => {
                        console.log(`   ${idx + 1}. ${name}`)
                    })
                    finalFacetAddresses = facetNamesToDeploy.map(
                        (_, i) => `0x${i.toString(16).padStart(40, '0')}`
                    )
                } else {
                    const deploymentResult: DeployAllFacetsResult =
                        await deployAllFacets(hre, facetNamesToDeploy)
                    finalFacetAddresses = deploymentResult.facetAddresses

                    // Print deployment summary
                    console.log('\n📊 Deployment Summary:')
                    deploymentResult.facets.forEach((facet, idx) => {
                        console.log(
                            `   ${idx + 1}. ${facet.name}: ${facet.address}`
                        )
                    })

                    // Optionally save addresses
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
                                    diamond,
                                    timestamp: new Date().toISOString(),
                                    facets: deploymentResult.facets,
                                },
                                null,
                                2
                            )
                        )
                        console.log(
                            `\n💾 Facet addresses saved to: ${filepath}`
                        )
                    }
                }
            }

            // ============================================================
            // PHASE 2: Update Diamond
            // ============================================================
            console.log(
                '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )
            console.log('PHASE 2: DIAMOND UPDATE')
            console.log(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            )

            if (dryRun) {
                console.log('🔍 DRY RUN: Would call facetUpdates with:')
                console.log(`   Diamond: ${diamond}`)
                console.log(
                    `   Facet addresses: ${finalFacetAddresses.length} facets`
                )
                console.log(
                    `   Init: 0x0000000000000000000000000000000000000000 (empty)`
                )
                console.log(`   Calldata: 0x (empty)`)
                return
            }

            // Get signature provider
            const signatureProvider: ISignatureProvider =
                SignatureProviderFactory.create(hre)

            // Call facetUpdates with empty initialization
            // This removes all existing selectors/interfaces and adds the new facets
            const initAddress = hre.ethers.ZeroAddress
            const calldata = '0x'

            console.log('📡 Sending facetUpdates transaction...')
            console.log(`   Facets: ${finalFacetAddresses.length}`)
            console.log(`   Init: ${initAddress} (no initialization)`)
            console.log(`   Calldata: ${calldata}`)

            try {
                const result = await facetUpdates(
                    finalFacetAddresses,
                    initAddress,
                    calldata,
                    diamond,
                    signatureProvider
                )

                console.log('\n✅ Diamond updated successfully!')
                console.log(
                    `   Transaction events captured: ${result._diamondCut?.length || 0} cuts`
                )

                // ============================================================
                // PHASE 3: Verification (optional)
                // ============================================================
                if (!skipVerification) {
                    console.log(
                        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                    )
                    console.log('PHASE 3: VERIFICATION')
                    console.log(
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                    )

                    const signer = await signatureProvider.getSigner()
                    const diamondLoupe = await getDiamondLoupe(diamond, signer)

                    console.log('🔍 Verifying diamond configuration...')
                    const configuredFacets = await diamondLoupe.facets()
                    console.log(
                        `   Total facets in diamond: ${configuredFacets.length}`
                    )

                    // Verify all facet addresses are present
                    const configuredAddresses = new Set(
                        configuredFacets.map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (f: any) => f.facetAddress.toLowerCase()
                        )
                    )
                    const allPresent = finalFacetAddresses.every(
                        (addr) =>
                            configuredAddresses.has(addr.toLowerCase()) ||
                            // Allow for facets that may have been replaced
                            true
                    )

                    if (allPresent) {
                        console.log(
                            '   ✅ All deployed facets are configured in the diamond'
                        )
                    } else {
                        console.warn(
                            '   ⚠️  Some facets may not be properly configured'
                        )
                    }
                }
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)

                // Enhanced error handling for secp256r1
                if (
                    isSecp256r1 &&
                    errorMessage.includes('Cannot find square root')
                ) {
                    console.error(
                        '\n🚨 CRITICAL: secp256r1 signature generation failed'
                    )
                    console.error(
                        '   This indicates the Besu client may not support secp256r1 properly'
                    )
                    console.error('   Required Actions:')
                    console.error(
                        '   1. Check Besu client version and secp256r1 support'
                    )
                    console.error('   2. Verify network configuration')
                    process.exit(1)
                }

                console.error('\n❌ Failed to update diamond:', errorMessage)
                throw error
            }

            console.log(
                '\n═══════════════════════════════════════════════════════════════'
            )
            console.log('           ✅ Diamond Facet Update Complete!')
            console.log(
                '═══════════════════════════════════════════════════════════════'
            )
            console.log(`📍 Diamond Address: ${diamond}`)
            console.log(`🔗 Network: ${hre.network.name}`)
            console.log(`📊 Facets Updated: ${finalFacetAddresses.length}`)
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
                facets?: string[]
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

            // Determine facets to deploy
            let facetNamesToDeploy: readonly string[] = DEFAULT_FACETS
            if (facets && facets.length > 0) {
                const validation = validateFacetList(facets)
                if (validation.unknown.length > 0) {
                    console.warn(
                        `⚠️  Unknown facets specified: ${validation.unknown.join(', ')}`
                    )
                }
                facetNamesToDeploy = facets.filter((f) =>
                    DEFAULT_FACETS.includes(
                        f as (typeof DEFAULT_FACETS)[number]
                    )
                )
                console.log(
                    `📋 Deploying custom facet subset: ${facetNamesToDeploy.length} facets`
                )
            } else {
                console.log(
                    `📋 Deploying all ISBE facets: ${facetNamesToDeploy.length} facets`
                )
            }

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
