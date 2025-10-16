export const TOKEN_CONFIGURATION_IDS = {
    ERC20: 'ERC20_CONFIG',
    ERC721: 'ERC721_CONFIG',
}

export const CONFIGURATION_IDS = {
    ERC20: '0x0000000000000000000000000000000000000000000000000000000000000020',
    ERC721: '0x0000000000000000000000000000000000000000000000000000000000000721',
    DID_REGISTRY:
        '0x00000000000000000000000000000000000000004449445F5245474953545259',
    HASH_TIMESTAMP:
        '0x56209af0faa47cd136c87cbd8b739b3beb4ac51cbba6ec828e2ae8421365929e',
    CLIENT_FILTERING:
        '0x0000000000000000000000000000000000436C69656E7446696C746572696E67',
    ENS_REGISTRY:
        '0x000000000000000000000000000000000000000000456E735265676973747279',
    ENS_PUBLIC_RESOLVER:
        '0x0000000000000000000000000000000000000000456e735075626c6963526573',
}

export const ARTIFACT_PATHS = {
    // Base facets
    ISBE_CUT: 'contracts/proxies/isbeproxy/facets/IsbeCutFacet.sol',
    ISBE_LOUPE: 'contracts/proxies/isbeproxy/facets/IsbeLoupeFacet.sol',
    ACCESS_CONTROL: 'contracts/access/accessControl/AccessControlFacet.sol',
    PAUSE: 'contracts/pause/ISBEPauseFacet.sol',

    // ERC20 facets
    ERC20: 'contracts/tokens/erc20/ERC20Facet.sol',
    ERC20_SNAPSHOT:
        'contracts/tokens/erc20/extensions/snapshot/ERC20SnapshotFacet.sol',
    ERC20_BURNABLE:
        'contracts/tokens/erc20/extensions/burn/ERC20BurnableFacet.sol',
    ERC20_CAPPED: 'contracts/tokens/erc20/extensions/cap/ERC20CappedFacet.sol',
    ERC20_CONTROLLER:
        'contracts/tokens/erc20/extensions/controller/ERC20ControllerFacet.sol',

    // ERC721 facets
    ERC721: 'contracts/tokens/erc721/ERC721Facet.sol',
    ERC721_BURNABLE:
        'contracts/tokens/erc721/extensions/burn/ERC721BurnableFacet.sol',
    ERC721_ENUMERABLE:
        'contracts/tokens/erc721/extensions/enumerable/ERC721EnumerableFacet.sol',
    ERC721_CAPPED:
        'contracts/tokens/erc721/extensions/cap/ERC721CappedFacet.sol',
    ERC721_CONTROLLER:
        'contracts/tokens/erc721/extensions/controller/ERC721ControllerFacet.sol',
    ERC721_SNAPSHOT:
        'contracts/tokens/erc721/extensions/snapshot/ERC721SnapshotFacet.sol',
    ERC721_ROYALTY:
        'contracts/tokens/erc721/extensions/royalty/ERC721RoyaltyFacet.sol',
    ERC721_CONSECUTIVE:
        'contracts/tokens/erc721/extensions/consecutive/ERC721ConsecutiveFacet.sol',

    // Utility facets
    HASH_TIMESTAMP: 'contracts/hashtimestamp/HashTimestampFacet.sol',
    OWNABLE: 'contracts/access/ownable/Ownable2StepFacet.sol',

    // DID Registry facets
    DID_DOCUMENT_DETAILED:
        'contracts/identity/didregistry/DidDocumentDetailedFacet.sol',
    DID_CONTROLLER: 'contracts/identity/didregistry/DidControllerFacet.sol',
    DID_VERIFICATION_METHOD:
        'contracts/identity/didregistry/DidVerificationMethodFacet.sol',
    DID_VERIFICATION_RELATIONSHIP:
        'contracts/identity/didregistry/DidVerificationRelationshipFacet.sol',
    CLIENT_FILTERING: 'contracts/client/filtering/ClientFilteringFacet.sol',

    // ENS facets
    ENS_REGISTRY: 'contracts/identity/ens/ensregistry/EnsRegistryFacet.sol',
    ENS_RESOLVER:
        'contracts/identity/ens/publicresolver/ensresolver/EnsResolverFacet.sol',
    ENS_NAME_RESOLVER:
        'contracts/identity/ens/publicresolver/profiles/name/NameResolverFacet.sol',
    ENS_TEXT_RESOLVER:
        'contracts/identity/ens/publicresolver/profiles/text/TextResolverFacet.sol',
    ENS_PUBKEY_RESOLVER:
        'contracts/identity/ens/publicresolver/profiles/pubkey/PubkeyResolverFacet.sol',
} as const

export const CONTRACT_NAMES = {
    // Base facets
    ISBE_CUT: 'IsbeCutFacet',
    ISBE_LOUPE: 'IsbeLoupeFacet',
    ACCESS_CONTROL: 'AccessControlFacet',
    PAUSE: 'ISBEPauseFacet',

    // ERC20 facets
    ERC20: 'ERC20Facet',
    ERC20_SNAPSHOT: 'ERC20SnapshotFacet',
    ERC20_BURNABLE: 'ERC20BurnableFacet',
    ERC20_CAPPED: 'ERC20CappedFacet',
    ERC20_CONTROLLER: 'ERC20ControllerFacet',

    // ERC721 facets
    ERC721: 'ERC721Facet',
    ERC721_BURNABLE: 'ERC721BurnableFacet',
    ERC721_ENUMERABLE: 'ERC721EnumerableFacet',
    ERC721_CAPPED: 'ERC721CappedFacet',
    ERC721_CONTROLLER: 'ERC721ControllerFacet',
    ERC721_SNAPSHOT: 'ERC721SnapshotFacet',
    ERC721_ROYALTY: 'ERC721RoyaltyFacet',
    ERC721_CONSECUTIVE: 'ERC721ConsecutiveFacet',

    // Utility facets
    HASH_TIMESTAMP: 'HashTimestampFacet',
    OWNABLE: 'Ownable2StepFacet',

    // DID Registry facets
    DID_DOCUMENT_DETAILED: 'DidDocumentDetailedFacet',
    DID_CONTROLLER: 'DidControllerFacet',
    DID_VERIFICATION_METHOD: 'DidVerificationMethodFacet',
    DID_VERIFICATION_RELATIONSHIP: 'DidVerificationRelationshipFacet',
    CLIENT_FILTERING: 'ClientFilteringFacet',

    // ENS facets
    ENS_REGISTRY: 'EnsRegistryFacet',
    ENS_RESOLVER: 'EnsResolverFacet',
    ENS_NAME_RESOLVER: 'NameResolverFacet',
    ENS_TEXT_RESOLVER: 'TextResolverFacet',
    ENS_PUBKEY_RESOLVER: 'PubkeyResolverFacet',
} as const
