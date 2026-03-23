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

/**
 * Diamond Upgrade E2E Script
 *
 * End-to-end script for upgrading ISBE Diamond facets.
 * Handles pre-flight checks, facet deployment, diamond update, and verification.
 */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    deployAllFacets,
    DEFAULT_FACETS,
    type DeployAllFacetsResult,
} from './deployAllFacets'
import { facetUpdates } from '../diamond/cut/facetUpdates'
import { getFacets } from '../configMgmt/getFacets'
import { checkFacetVersions, printVersionResults } from './checkFacetVersions'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'
import { NetworkConfigWithCurve } from '../../types/hardhat'

/**
 * E2E Upgrade Options
 */
export interface E2EUpgradeOptions {
    diamond: string
    facets?: string[]
    dryRun: boolean
    skipVerification: boolean
    saveAddresses: boolean
    checkVersions: boolean
}

/**
 * E2E Upgrade Result
 */
export interface E2EUpgradeResult {
    success: boolean
    diamond: string
    network: string
    timestamp: string
    curve: string
    preflight: {
        networkAccessible: boolean
        deployerHasFunds: boolean
        diamondExists: boolean
        deployerAddress: string
        deployerBalance: string
    }
    deployment?: {
        facets: DeployAllFacetsResult
        deploymentTimeMs: number
    }
    update?: {
        transactionHash: string
        facetsUpdated: number
    }
    verification?: {
        facetsCount: number
        versionCheckPassed: boolean
    }
    errors: string[]
}

/**
 * Run pre-flight checks before upgrade
 */
async function runPreflightChecks(
    hre: HardhatRuntimeEnvironment,
    diamond: string
): Promise<{
    passed: boolean
    results: E2EUpgradeResult['preflight']
    errors: string[]
}> {
    const errors: string[] = []
    const results: E2EUpgradeResult['preflight'] = {
        networkAccessible: false,
        deployerHasFunds: false,
        diamondExists: false,
        deployerAddress: '',
        deployerBalance: '0',
    }

    try {
        // Check network connectivity
        const blockNumber = await hre.ethers.provider.getBlockNumber()
        results.networkAccessible = blockNumber >= 0
        console.log(`   ✅ Network accessible (block: ${blockNumber})`)
    } catch (error: unknown) {
        errors.push(
            `Network not accessible: ${error instanceof Error ? error.message : String(error)}`
        )
        return { passed: false, results, errors }
    }

    try {
        // Check deployer account
        const signatureProvider = SignatureProviderFactory.create(hre)
        const signer = await signatureProvider.getSigner()
        results.deployerAddress = await signer.getAddress()
        const balance = await hre.ethers.provider.getBalance(
            results.deployerAddress
        )
        results.deployerBalance = hre.ethers.formatEther(balance)
        results.deployerHasFunds = balance > 0n

        if (results.deployerHasFunds) {
            console.log(
                `   ✅ Deployer has funds: ${results.deployerBalance} ETH`
            )
        } else {
            errors.push('Deployer account has no funds')
        }
    } catch (error: unknown) {
        errors.push(
            `Deployer check failed: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    try {
        // Check diamond exists
        const code = await hre.ethers.provider.getCode(diamond)
        results.diamondExists = code !== '0x'
        if (results.diamondExists) {
            console.log(`   ✅ Diamond exists at ${diamond}`)
        } else {
            errors.push(`No contract at diamond address ${diamond}`)
        }
    } catch (error: unknown) {
        errors.push(
            `Diamond check failed: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    return {
        passed: errors.length === 0,
        results,
        errors,
    }
}

/**
 * Run E2E diamond upgrade
 */
export async function upgradeDiamondE2E(
    hre: HardhatRuntimeEnvironment,
    options: E2EUpgradeOptions
): Promise<E2EUpgradeResult> {
    const {
        diamond,
        facets,
        dryRun,
        skipVerification,
        saveAddresses,
        checkVersions,
    } = options

    const errors: string[] = []
    const networkConfig = hre.config.networks[
        hre.network.name
    ] as NetworkConfigWithCurve
    const curve = networkConfig.curve || 'secp256k1'

    const result: E2EUpgradeResult = {
        success: false,
        diamond,
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        curve,
        preflight: {
            networkAccessible: false,
            deployerHasFunds: false,
            diamondExists: false,
            deployerAddress: '',
            deployerBalance: '0',
        },
        errors,
    }

    console.log(
        '═══════════════════════════════════════════════════════════════'
    )
    console.log('           ISBE DIAMOND E2E UPGRADE')
    console.log(
        '═══════════════════════════════════════════════════════════════'
    )
    console.log(`📍 Diamond: ${diamond}`)
    console.log(`🌐 Network: ${hre.network.name}`)
    console.log(`🔐 Curve: ${curve}`)
    console.log(`🕐 Time: ${result.timestamp}`)
    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No transactions will be sent')
    }

    // ============================================================
    // PHASE 1: Pre-flight Checks
    // ============================================================
    console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    console.log('PHASE 1: PRE-FLIGHT CHECKS')
    console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )

    const preflight = await runPreflightChecks(hre, diamond)
    result.preflight = preflight.results
    errors.push(...preflight.errors)

    if (!preflight.passed) {
        console.log('\n❌ Pre-flight checks failed. Aborting.')
        return result
    }

    // ============================================================
    // PHASE 2: Version Check (optional)
    // ============================================================
    if (checkVersions && !dryRun) {
        console.log(
            '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        )
        console.log('PHASE 2: PRE-UPGRADE VERSION CHECK')
        console.log(
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        )

        try {
            const versionResult = await checkFacetVersions(hre, diamond, facets)
            printVersionResults(versionResult)
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            console.log(`   ⚠️  Version check failed: ${msg}`)
        }
    }

    // ============================================================
    // PHASE 3: Facet Deployment
    // ============================================================
    console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    console.log('PHASE 3: FACET DEPLOYMENT')
    console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )

    const facetNames = facets || [...DEFAULT_FACETS]
    console.log(`   Facets to deploy: ${facetNames.length}`)

    if (dryRun) {
        console.log('   🔍 DRY RUN: Would deploy facets:')
        facetNames.forEach((name, idx) => {
            console.log(`      ${idx + 1}. ${name}`)
        })
        result.success = true
        return result
    }

    let deploymentResult: DeployAllFacetsResult
    try {
        deploymentResult = await deployAllFacets(hre, facetNames)
        result.deployment = {
            facets: deploymentResult,
            deploymentTimeMs: deploymentResult.deploymentTimeMs,
        }
        console.log(
            `\n   ✅ All ${deploymentResult.facetAddresses.length} facets deployed`
        )
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        errors.push(`Facet deployment failed: ${msg}`)
        console.log(`\n   ❌ Facet deployment failed: ${msg}`)
        return result
    }

    // ============================================================
    // PHASE 4: Diamond Update
    // ============================================================
    console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    console.log('PHASE 4: DIAMOND UPDATE')
    console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )

    const signatureProvider = SignatureProviderFactory.create(hre)
    const initAddress = hre.ethers.ZeroAddress
    const calldata = '0x'

    try {
        console.log('   📡 Sending facetUpdates transaction...')
        const updateResult = await facetUpdates(
            deploymentResult.facetAddresses,
            initAddress,
            calldata,
            diamond,
            signatureProvider
        )
        result.update = {
            transactionHash: updateResult.hash || 'unknown',
            facetsUpdated: deploymentResult.facetAddresses.length,
        }
        console.log(`   ✅ Diamond updated successfully`)
        if (updateResult.hash) {
            console.log(`   📝 Transaction: ${updateResult.hash}`)
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        errors.push(`Diamond update failed: ${msg}`)
        console.log(`   ❌ Diamond update failed: ${msg}`)
        return result
    }

    // ============================================================
    // PHASE 5: Verification
    // ============================================================
    if (!skipVerification) {
        console.log(
            '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        )
        console.log('PHASE 5: VERIFICATION')
        console.log(
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        )

        try {
            const signer = await signatureProvider.getSigner()
            const loupe = await getFacets(diamond, signer)
            const configuredFacets = await loupe.facets()

            console.log(`   📊 Facets in diamond: ${configuredFacets.length}`)

            // Verify all deployed facets are present
            const configuredAddresses = new Set(
                configuredFacets.map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (f: any) => f.facetAddress.toLowerCase()
                )
            )
            const allPresent = deploymentResult.facetAddresses.every((addr) =>
                configuredAddresses.has(addr.toLowerCase())
            )

            if (allPresent) {
                console.log(
                    '   ✅ All deployed facets are configured in the diamond'
                )
            } else {
                console.log('   ⚠️  Some facets may not be properly configured')
            }

            // Version check
            if (checkVersions) {
                const versionResult = await checkFacetVersions(
                    hre,
                    diamond,
                    facetNames
                )
                result.verification = {
                    facetsCount: configuredFacets.length,
                    versionCheckPassed:
                        versionResult.summary.matched ===
                        versionResult.summary.total,
                }
                printVersionResults(versionResult)
            } else {
                result.verification = {
                    facetsCount: configuredFacets.length,
                    versionCheckPassed: true,
                }
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            errors.push(`Verification failed: ${msg}`)
            console.log(`   ⚠️  Verification failed: ${msg}`)
        }
    }

    // Save addresses if requested
    if (saveAddresses && result.deployment) {
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
                    curve,
                    timestamp: result.timestamp,
                    facets: result.deployment.facets.facets,
                },
                null,
                2
            )
        )
        console.log(`\n💾 Facet addresses saved to: ${filepath}`)
    }

    result.success = errors.length === 0

    console.log(
        '\n═══════════════════════════════════════════════════════════════'
    )
    if (result.success) {
        console.log('           ✅ E2E UPGRADE COMPLETE')
    } else {
        console.log('           ❌ E2E UPGRADE FAILED')
    }
    console.log(
        '═══════════════════════════════════════════════════════════════'
    )
    console.log(`📍 Diamond: ${diamond}`)
    console.log(`🌐 Network: ${hre.network.name}`)
    console.log(`🔐 Curve: ${curve}`)

    if (result.deployment) {
        console.log(
            `📊 Facets Deployed: ${result.deployment.facets.facetAddresses.length}`
        )
        console.log(
            `⏱️  Deployment Time: ${(result.deployment.deploymentTimeMs / 1000).toFixed(2)}s`
        )
    }
    if (result.update) {
        console.log(`🔄 Facets Updated: ${result.update.facetsUpdated}`)
    }

    return result
}
