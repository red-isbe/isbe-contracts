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
import { DEFAULT_FACETS, type DeployAllFacetsResult } from './deployAllFacets'
import {
    runDiamondUpgrade,
    type DiamondUpgradeResult,
} from './safeDiamondUpgrade'
import { getDiamondLoupe } from '../utils/getDiamondLoupe'
import { checkFacetVersions, printVersionResults } from './checkFacetVersions'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'
import { NetworkConfigWithCurve } from '../../types/hardhat'

/**
 * E2E Upgrade Options
 */
export interface E2EUpgradeOptions {
    diamond: string
    /** Validated facet names (see resolveFacetSelection). Undefined: full replacement */
    facets?: string[]
    dryRun: boolean
    /** Allow removing functions that the new facets no longer declare */
    allowRemove?: boolean
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
    const allowRemove = options.allowRemove ?? false

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
    // PHASE 3: Safe upgrade (deploy, plan, simulate, send, verify)
    // ============================================================
    console.log(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    console.log(
        facets
            ? `PHASE 3: PARTIAL UPGRADE (${facets.join(', ')})`
            : 'PHASE 3: FULL REPLACEMENT (all ISBE facets)'
    )
    console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )

    const facetNames = facets || [...DEFAULT_FACETS]
    const saveFacetAddresses = async (
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
                    diamond,
                    curve,
                    timestamp: result.timestamp,
                    facets: deployed,
                },
                null,
                2
            )
        )
        console.log(`\n💾 Facet addresses saved to: ${filepath}`)
    }
    let upgrade: DiamondUpgradeResult
    try {
        upgrade = await runDiamondUpgrade(hre, {
            diamond,
            facets,
            dryRun,
            allowRemove,
            skipVerification,
            // Saved as soon as the facets exist, so they can be reused with
            // --facet-addresses even if a later step fails
            onFacetsDeployed: saveAddresses
                ? (deployed) => saveFacetAddresses(deployed)
                : undefined,
        })
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        errors.push(`Diamond upgrade failed: ${msg}`)
        console.log(`\n   ❌ ${msg}`)
        return result
    }

    if (dryRun) {
        result.success = true
        return result
    }

    if (upgrade.deployed.length > 0) {
        const facetAddresses = upgrade.deployed.map((f) => f.address)
        result.deployment = {
            facets: {
                facets: upgrade.deployed,
                facetAddresses,
                totalGasUsed: BigInt(0),
                deploymentTimeMs: 0,
            },
            deploymentTimeMs: 0,
        }
    }
    if (upgrade.executed) {
        result.update = {
            transactionHash: upgrade.transactionHashes.join(', '),
            facetsUpdated: upgrade.plan.changes.length,
        }
    }

    // ============================================================
    // PHASE 4: Version check (optional)
    // ============================================================
    if (upgrade.executed && checkVersions) {
        try {
            const loupe = await getDiamondLoupe(
                diamond,
                await SignatureProviderFactory.create(hre).getSigner()
            )
            const configuredFacets = await loupe.facets()
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
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error)
            errors.push(`Version check failed: ${msg}`)
            console.log(`   ⚠️  Version check failed: ${msg}`)
        }
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
