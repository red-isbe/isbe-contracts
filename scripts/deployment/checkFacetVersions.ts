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
 * Check Facet Versions
 *
 * Queries deployed diamond for facet versions and compares with code versions.
 * Useful for verifying deployment status before/after upgrades.
 */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { FACET_RESOLVER_KEYS, FACET_CODE_VERSIONS } from './facetResolverKeys'
import { getFacets } from '../configMgmt/getFacets'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'
/**
 * Result of checking a single facet version
 */
export interface FacetVersionResult {
    name: string
    resolverKey: string
    onChainVersion: bigint | null
    codeVersion: number
    match: boolean
    error?: string
}

/**
 * Result of checking all facet versions
 */
export interface CheckFacetVersionsResult {
    diamond: string
    network: string
    timestamp: string
    facets: FacetVersionResult[]
    summary: {
        total: number
        matched: number
        mismatched: number
        notFound: number
        errors: number
    }
}

/**
 * Default diamond address for ISBE networks
 */
export const DEFAULT_DIAMOND_ADDRESS =
    '0x00000000000000000000000000000000000015BE'

/**
 * Check versions of all facets in a deployed diamond
 *
 * @param diamond - Diamond contract address
 * @param facetNames - Optional list of facet names to check (defaults to all known)
 * @returns Detailed version check results
 */
export async function checkFacetVersions(
    hre: HardhatRuntimeEnvironment,
    diamond: string = DEFAULT_DIAMOND_ADDRESS,
    facetNames?: string[]
): Promise<CheckFacetVersionsResult> {
    const signatureProvider = SignatureProviderFactory.create(hre)
    const signer = await signatureProvider.getSigner()
    const loupe = await getFacets(diamond, signer)

    const namesToCheck = facetNames || Object.keys(FACET_RESOLVER_KEYS)
    const results: FacetVersionResult[] = []

    for (const name of namesToCheck) {
        const resolverKey = FACET_RESOLVER_KEYS[name]
        const codeVersion = FACET_CODE_VERSIONS[name] || 0

        if (!resolverKey) {
            results.push({
                name,
                resolverKey: 'N/A',
                onChainVersion: null,
                codeVersion,
                match: false,
                error: 'No resolver key found',
            })
            continue
        }

        try {
            const onChainVersion = await loupe.facetVersion(resolverKey)
            const match = Number(onChainVersion) === codeVersion

            results.push({
                name,
                resolverKey,
                onChainVersion,
                codeVersion,
                match,
            })
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            results.push({
                name,
                resolverKey,
                onChainVersion: null,
                codeVersion,
                match: false,
                error: errorMessage.includes('not found')
                    ? 'Facet not initialized'
                    : errorMessage,
            })
        }
    }

    const summary = {
        total: results.length,
        matched: results.filter((r) => r.match).length,
        mismatched: results.filter((r) => !r.match && r.onChainVersion !== null)
            .length,
        notFound: results.filter(
            (r) =>
                r.onChainVersion === null && !r.error?.includes('No resolver')
        ).length,
        errors: results.filter(
            (r) => r.error && !r.error.includes('not initialized')
        ).length,
    }

    return {
        diamond,
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        facets: results,
        summary,
    }
}

/**
 * Print version check results as a formatted table
 */
export function printVersionResults(result: CheckFacetVersionsResult): void {
    console.log(
        '\n═══════════════════════════════════════════════════════════════'
    )
    console.log('           FACET VERSION CHECK')
    console.log(
        '═══════════════════════════════════════════════════════════════'
    )
    console.log(`📍 Diamond: ${result.diamond}`)
    console.log(`🌐 Network: ${result.network}`)
    console.log(`📅 Time: ${result.timestamp}`)
    console.log(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )

    console.log(
        '\n┌─────────────────────────────────────┬───────────┬───────────┬────────┐'
    )
    console.log(
        '│ Facet Name                          │ On-Chain  │ Code      │ Status │'
    )
    console.log(
        '├─────────────────────────────────────┼───────────┼───────────┼────────┤'
    )

    for (const facet of result.facets) {
        const onChain =
            facet.onChainVersion !== null
                ? facet.onChainVersion.toString()
                : 'N/A'
        const code = facet.codeVersion.toString()
        const status = facet.match ? '✅' : facet.error ? '⚠️ ' : '❌'
        const name = facet.name.padEnd(35).slice(0, 35)
        const onChainStr = onChain.toString().padStart(9).slice(0, 9)
        const codeStr = code.toString().padStart(9).slice(0, 9)

        console.log(`│ ${name} │ ${onChainStr} │ ${codeStr} │ ${status}     │`)
    }

    console.log(
        '└─────────────────────────────────────┴───────────┴───────────┴────────┘'
    )

    console.log('\n📊 Summary:')
    console.log(`   Total facets checked: ${result.summary.total}`)
    console.log(`   ✅ Matched: ${result.summary.matched}`)
    console.log(`   ❌ Mismatched: ${result.summary.mismatched}`)
    console.log(`   ⚠️  Not initialized: ${result.summary.notFound}`)
    console.log(`   🚨 Errors: ${result.summary.errors}`)

    if (result.summary.matched === result.summary.total) {
        console.log('\n✅ All facet versions match the codebase!')
    } else if (result.summary.matched > 0) {
        console.log('\n⚠️  Some facet versions differ - upgrade may be needed')
    } else {
        console.log(
            '\n❌ No matching facet versions - diamond may not be initialized'
        )
    }

    console.log(
        '═══════════════════════════════════════════════════════════════'
    )
}

/**
 * Get current facet addresses from diamond
 */
export async function getFacetAddresses(
    diamond: string,
    hre: HardhatRuntimeEnvironment
): Promise<Map<string, string>> {
    const signatureProvider = SignatureProviderFactory.create(hre)
    const signer = await signatureProvider.getSigner()
    const loupe = await getFacets(diamond, signer)
    const facets = await loupe.facets()

    const addressMap = new Map<string, string>()
    for (const facet of facets) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const address = (facet as any).facetAddress as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selectors = (facet as any).functionSelectors as string[]
        if (selectors && selectors.length > 0) {
            // Use first selector as key for the facet
            addressMap.set(selectors[0], address)
        }
    }

    return addressMap
}
