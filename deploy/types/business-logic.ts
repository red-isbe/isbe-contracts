/**
 * Business Logic-specific types
 */

import { BusinessLogicCategory } from './index'

export interface BusinessLogicGroup {
    category: BusinessLogicCategory
    facets: string[]
    description: string
}

export const BUSINESS_LOGIC_GROUPS: Record<
    BusinessLogicCategory,
    BusinessLogicGroup
> = {
    [BusinessLogicCategory.CORE]: {
        category: BusinessLogicCategory.CORE,
        facets: [
            'IsbeCutFacet',
            'IsbeLoupeFacet',
            'AccessControlFacet',
            'ISBEPauseFacet',
        ],
        description: 'Core Diamond facets (always included)',
    },
    [BusinessLogicCategory.TOKEN]: {
        category: BusinessLogicCategory.TOKEN,
        facets: [
            // ERC20
            'ERC20Facet',
            'ERC20BurnableFacet',
            'ERC20CappedFacet',
            'ERC20ControllerFacet',
            'ERC20SnapshotFacet',
            // ERC721
            'ERC721Facet',
            'ERC721BurnableFacet',
            'ERC721EnumerableFacet',
            'ERC721CappedFacet',
            'ERC721ControllerFacet',
            'ERC721SnapshotFacet',
            'ERC721RoyaltyFacet',
            'ERC721ConsecutiveFacet',
        ],
        description: 'Token implementations (ERC20, ERC721)',
    },
    [BusinessLogicCategory.IDENTITY]: {
        category: BusinessLogicCategory.IDENTITY,
        facets: [
            // DID
            'DidControllerFacet',
            'DidVerificationMethodFacet',
            'DidVerificationRelationshipFacet',
            'DidDocumentDetailedFacet',
            'DidRegistryQueryFacet',
            // ENS
            'EnsRegistryFacet',
            'EnsResolverFacet',
            'NameResolverFacet',
            'PubkeyResolverFacet',
            'TextResolverFacet',
        ],
        description: 'Identity management (DID, ENS)',
    },
    [BusinessLogicCategory.UTILITY]: {
        category: BusinessLogicCategory.UTILITY,
        facets: ['HashTimestampFacet', 'OwnableFacet', 'AssetEventTrackerFacet'],
        description: 'Utility facets',
    },
    [BusinessLogicCategory.CLIENT]: {
        category: BusinessLogicCategory.CLIENT,
        facets: [
            'ClientFilteringFacet',
            'BesuNodeManagerFacet',
            'TimeStampingRegistryFacet',
        ],
        description: 'Client services',
    },
}

export function getAllBusinessLogicFacets(): string[] {
    return Object.values(BUSINESS_LOGIC_GROUPS).flatMap((group) => group.facets)
}

export function getBusinessLogicsByCategory(
    category: BusinessLogicCategory
): string[] {
    return BUSINESS_LOGIC_GROUPS[category]?.facets || []
}
