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
 * Facet deployment utilities for ISBE Diamond
 *
 * This module provides functions to deploy all ISBE facets and manage their configuration.
 */

/**
 */

/**
 * Default facets to deploy for ISBE Diamond
 * These are the standard facets that make up the ISBE governance system
 */
export const DEFAULT_FACETS = [
    'BusinessLogicFactoryFacet',
    'ProxyFactoryFacet',
    'GlobalIsbePauseFacet',
    'AccessControlGovernanceFacet',
    'AccessControlDidGovernanceFacet',
    'ISBEPauseFacet',
    'DiamondCutAccessControlFacet',
    'DiamondLoupeFacet',
    'ConfigurationManagementFacet',
    'DidDocumentDetailedFacet',
    'DidControllerFacet',
    'DidVerificationMethodFacet',
    'DidVerificationRelationshipFacet',
    'DidRegistryQueryFacet',
    'TrustedIssuersRegistryFacet',
    'EnsRegistryFacet',
    'TimeStampingRegistryFacet',
    'ClientFilteringFacet',
    'NetworkDirectoryFacet',
    'BesuNodeManagerFacet',
    'AnchoringCoreFacet',
] as const

export type FacetName = (typeof DEFAULT_FACETS)[number]

/**
 * Result of deploying a single facet
 */
export interface FacetDeploymentResult {
    name: string
    address: string
    transactionHash: string
    gasUsed?: bigint
}

/**
 * Result of deploying all facets
 */
export interface DeployAllFacetsResult {
    facets: FacetDeploymentResult[]
    facetAddresses: string[]
    totalGasUsed: bigint
    deploymentTimeMs: number
}

async function deployFacet(
    ethers: HardhatRuntimeEnvironment['ethers'],
    facetName: string,
    gasLimit: number = 15_000_000
): Promise<FacetDeploymentResult> {
    console.log(`   📦 Deploying ${facetName}...`)

    const factory = await ethers.getContractFactory(facetName)
    const contract = await factory.deploy({ gasLimit })
    await contract.waitForDeployment()

    const address = await contract.getAddress()
    const deployTx = contract.deploymentTransaction()

    console.log(`   ✅ ${facetName} deployed at: ${address}`)

    return {
        name: facetName,
        address,
        transactionHash: deployTx?.hash || '',
    }
}

export async function deployAllFacets(
    hre: HardhatRuntimeEnvironment,
    facets: readonly string[] = DEFAULT_FACETS,
    gasLimit: number = 15_000_000
): Promise<DeployAllFacetsResult> {
    const ethers = hre.ethers

    console.log('🚀 Starting ISBE facet deployment...')
    console.log(`   Network: ${hre.network.name}`)
    console.log(`   Facets to deploy: ${facets.length}`)

    const startTime = Date.now()
    const deploymentResults: FacetDeploymentResult[] = []
    const facetAddresses: string[] = []

    // Check network configuration
    const networkConfig = hre.config.networks[hre.network.name] as {
        curve?: string
    }
    if (networkConfig.curve === 'secp256r1') {
        console.log(
            '   🔐 secp256r1 network detected - deployment will use raw transactions if needed'
        )
    }

    // Deploy each facet sequentially
    for (const facetName of facets) {
        try {
            const result = await deployFacet(ethers, facetName, gasLimit)
            deploymentResults.push(result)
            facetAddresses.push(result.address)
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            console.error(
                `   ❌ Failed to deploy ${facetName}: ${errorMessage}`
            )
            throw new Error(
                `Failed to deploy facet ${facetName}: ${errorMessage}`
            )
        }
    }

    const deploymentTimeMs = Date.now() - startTime

    console.log('\n✅ All facets deployed successfully!')
    console.log(
        `   Total deployment time: ${(deploymentTimeMs / 1000).toFixed(2)}s`
    )
    console.log(`   Total facets: ${facetAddresses.length}`)

    return {
        facets: deploymentResults,
        facetAddresses,
        totalGasUsed: BigInt(0), // Gas tracking would require receipt parsing
        deploymentTimeMs,
    }
}

/**
 * Get facet names for a subset of facets
 * Useful for deploying only specific facets
 */
export function getFacetSubset(subsetNames: string[]): string[] {
    return subsetNames.filter((name) =>
        DEFAULT_FACETS.includes(name as FacetName)
    )
}

/**
 * Validate that all required facets are present
 */
export function validateFacetList(facets: string[]): {
    valid: boolean
    missing: string[]
    unknown: string[]
} {
    const defaultSet = new Set(DEFAULT_FACETS)
    const inputSet = new Set(facets)

    const missing = DEFAULT_FACETS.filter((f) => !inputSet.has(f))
    const unknown = facets.filter((f) => !defaultSet.has(f))

    return {
        valid: missing.length === 0 && unknown.length === 0,
        missing,
        unknown,
    }
}
