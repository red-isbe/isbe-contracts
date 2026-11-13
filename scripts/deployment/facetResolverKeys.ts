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
 * Facet Resolver Keys Mapping
 *
 * Maps facet names to their resolver keys for version checking.
 * These resolver keys are used to query facet versions from the diamond.
 */

/**
 * Mapping of facet names to their resolver keys (bytes32).
 * Keys correspond to keccak256 hashes of unique facet identifiers.
 */
export const FACET_RESOLVER_KEYS: Record<string, string> = {
    // Access Control
    AccessControlGovernanceFacet:
        '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c',
    AccessControlDidGovernanceFacet:
        '0x91be68699977a17d16f4f996441c2bbd87a413d1114ef61d6d70019fc7904f4a',

    // Business Logic Factory
    BusinessLogicFactoryFacet:
        '0xc6315ad82a957243645764f5542166d6ca27427e14eee4c56d66d963349845f4',

    // Configuration Management
    ConfigurationManagementFacet:
        '0x5c7eb9eee8ef1c4aad127182f7de73ed25d3582b9b642ad6c67b50ea0ce43eaf',

    // Proxy Factory
    ProxyFactoryFacet:
        '0x949f2c59318fff1925835e4fd22837f508de87f71875ac3e71a5f5c7e4c74d10',

    // Global Pause
    GlobalIsbePauseFacet:
        '0x95abb588e90c3cf7e85016cd7eef6fcbf9073b2a59c113a2f59ef664c86cf3f3',

    // Pause
    ISBEPauseFacet:
        '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3',

    // Diamond Cut Access Control
    DiamondCutAccessControlFacet:
        '0xb1733495acec04f904af52509bd68775ca2e4aa31f6948d02cccd2af2adee890',

    // Diamond Loupe
    DiamondLoupeFacet:
        '0xa081a7fa2e40735a4006bc6a225e18158879b54064ab1f60045661349931c41b',

    // DID Document Detailed
    DidDocumentDetailedFacet:
        '0x5a02d9131742d56d318dab3c9e499ea3b8e4388b578aac9d31b55350b1076873',

    // DID Controller
    DidControllerFacet:
        '0x26339b1ee881bb2790df0ed18d4f8f5f6b66c9855aac4f506052b0cf2f51188c',

    // DID Verification Method
    DidVerificationMethodFacet:
        '0xac8773db319c7049be61ab52c59325712b4ba639daa556105c3b1e20671238dd',

    // DID Verification Relationship
    DidVerificationRelationshipFacet:
        '0x32bd32541f3651dc69848ddc9cad21896eabb6a11034c19b03683da6e19b76d7',

    // DID Registry Query
    DidRegistryQueryFacet:
        '0x5fb7bbf7185d00a34fa9c782b90e076f7b5d9e337febead788d0b980b59aa53b',

    // Service DID Registry
    ServiceDidRegistryFacet:
        '0x3f4e1fc72c9cbf8beed300a44313de512ca7c62e779f6b5108db48809b858f6f',

    // Trusted Issuers Registry
    TrustedIssuersRegistryFacet:
        '0xa6d24218dbc9b95fcf333de1ad885429be1bc02839798a978c01989cffe93983',

    // ENS Registry
    EnsRegistryFacet:
        '0xc0629a5fdc41a377e7fd772f766ce559d0fecbb52e72bd1b4915525935b59053',

    // Timestamping Registry
    TimeStampingRegistryFacet:
        '0xc96c356b7532d6eba398b97f362b68829d7392627c879e8ba5909c4810ca7ad5',

    // Client Filtering
    ClientFilteringFacet:
        '0x9d459b48dcede9ec86807b1af972b62ab0b2b0237e2187da45c02c25f3aeb016',

    // Network Directory
    NetworkDirectoryFacet:
        '0xa02352a617fa557d3bef91c39fbe51f1ffb7d8f551ceafd425722840430d2969',

    // Besu Node Manager
    BesuNodeManagerFacet:
        '0xed251ea052ffafa4903db889a3309600adf2ac15456e02760c1221ea3792c1ca',

    // Anchoring Core
    AnchoringCoreFacet:
        '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',

    // ERC-20
    ERC20Facet:
        '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad',

    // ERC-721
    ERC721Facet:
        '0x90e014dbbf0f1e8a714d05a5a0c9464d9ab25275f7dcdaf3297d1ccc80452413',

    // ERC-3643 Compliance
    ERC3643ComplianceFacet:
        '0x8a5420a9e83a88b62e9b707d311e9dbf53149c09464f3c1c33d0b8d85f7ca10b',

    // Additional resolver keys for other facets
    OwnableFacet:
        '0x32d893fe746ed6e72cf641731066f84e26611cdd03031f873957cb1a29071a5f',
    ERC165Facet:
        '0x0d211187337a25b55ba62c44fbaaff686007a4ff3d149631d418963345936a29',
}

/**
 * Code versions for facets (from contracts/constants/facetVersions.sol)
 * These are the expected versions in the current codebase.
 */
export const FACET_CODE_VERSIONS: Record<string, number> = {
    AccessControlGovernanceFacet: 1,
    AccessControlDidGovernanceFacet: 1,
    BusinessLogicFactoryFacet: 1,
    ConfigurationManagementFacet: 1,
    ProxyFactoryFacet: 1,
    GlobalIsbePauseFacet: 1,
    ISBEPauseFacet: 1,
    DiamondCutAccessControlFacet: 1,
    DiamondLoupeFacet: 1,
    DidDocumentDetailedFacet: 1,
    DidControllerFacet: 1,
    DidVerificationMethodFacet: 1,
    DidVerificationRelationshipFacet: 1,
    DidRegistryQueryFacet: 1,
    ServiceDidRegistryFacet: 1,
    TrustedIssuersRegistryFacet: 1,
    EnsRegistryFacet: 1,
    TimeStampingRegistryFacet: 1,
    ClientFilteringFacet: 1,
    NetworkDirectoryFacet: 1,
    BesuNodeManagerFacet: 1,
    AnchoringCoreFacet: 1,
    ERC20Facet: 1,
    ERC721Facet: 1,
    ERC3643ComplianceFacet: 1,
    OwnableFacet: 1,
    ERC165Facet: 1,
}

/**
 * Get the resolver key for a facet name
 */
export function getFacetResolverKey(facetName: string): string | undefined {
    return FACET_RESOLVER_KEYS[facetName]
}

/**
 * Get all facet names with resolver keys
 */
export function getAllFacetNames(): string[] {
    return Object.keys(FACET_RESOLVER_KEYS)
}

/**
 * Check if a facet has a known resolver key
 */
export function hasResolverKey(facetName: string): boolean {
    return facetName in FACET_RESOLVER_KEYS
}
