// ================================
// VERSION CONFIGURATION
// ================================
import { UseCaseConfig } from '../types/DeploymentTypes'

export const DEFAULT_VERSION = 0

// ================================
// RESOLVER KEYS - Business Logic IDs
// ================================

// ISBE system base facets
export const ISBE_CUT_RESOLVER_KEY =
    '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25'
export const ISBE_LOUPE_RESOLVER_KEY =
    '0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2'
export const ACCESS_CONTROL_RESOLVER_KEY =
    '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c'
export const PAUSE_RESOLVER_KEY =
    '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3'

// ERC20 facets
export const ERC20_RESOLVER_KEY =
    '0x2428f215905ecd05cc26794e218b9fad455e6ae2ca828b2f1c1903e8770265ad'
export const ERC20_SNAPSHOT_RESOLVER_KEY =
    '0xc4968fe952eba32a52cb112176a56b4e86a0fbaff835dc8336fa0e804a0af398'
export const ERC20_BURNABLE_RESOLVER_KEY =
    '0x81c694c8d5a595cfca0b2b486a8e2aff0a72d8063c636a02c1ca1cc12e55d471'
export const ERC20_CAPPED_RESOLVER_KEY =
    '0x94ece6781e9aebbdab29d2bbc0301c80b7bcb1194c5c3efc08e3d35c7f6d741b'
export const ERC20_CONTROLLER_RESOLVER_KEY =
    '0xed76d446b6029b8a177fda4fc38162d9dc0dc29ab636541fd6e75ae60fe17151'

// ERC721 facets
export const ERC721_RESOLVER_KEY =
    '0x90e014dbbf0f1e8a714d05a5a0c9464d9ab25275f7dcdaf3297d1ccc80452413'
export const ERC721_BURNABLE_RESOLVER_KEY =
    '0x206b0e4238408e5768282093d791f76fa433862449b7d2f6bcfcf6334c68b731'
export const ERC721_ENUMERABLE_RESOLVER_KEY =
    '0xedb7f9fdb1d3f5f42d41b01b9be5a65625ceb3729df0767c42252b0ba9d8ccd5'
export const ERC721_CAPPED_RESOLVER_KEY =
    '0x562609faca97c2599c7b5267f4c9852db8d80261577ecea4c9660ff46f48ac8c'
export const ERC721_CONTROLLER_RESOLVER_KEY =
    '0x3151ba844095052447f78f5266df4cb3ce2c27fccb2dddb913b38ef0f5856367'
export const ERC721_SNAPSHOT_RESOLVER_KEY =
    '0xf1a2b064b8a113b55cf2e7361db7c9361c635ec4d56c34424cf80a1d6478b51d'
export const ERC721_ROYALTY_RESOLVER_KEY =
    '0x93a54f9adbfdce1437a27b11fa135ad0c5624ec6bf9a2b133b77864668ddab76'

// Utility facets
export const HASH_TIMESTAMP_RESOLVER_KEY =
    '0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a'
export const OWNABLE_RESOLVER_KEY =
    '0x32d893fe746ed6e72cf641731066f84e26611cdd03031f873957cb1a29071a5f'

// DID Registry facets
export const DID_DOCUMENT_DETAILED_RESOLVER_KEY =
    '0x5a02d9131742d56d318dab3c9e499ea3b8e4388b578aac9d31b55350b1076873'
export const DID_CONTROLLER_RESOLVER_KEY =
    '0x26339b1ee881bb2790df0ed18d4f8f5f6b66c9855aac4f506052b0cf2f51188c'
export const DID_VERIFICATION_METHOD_RESOLVER_KEY =
    '0xac8773db319c7049be61ab52c59325712b4ba639daa556105c3b1e20671238dd'
export const DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY =
    '0x32bd32541f3651dc69848ddc9cad21896eabb6a11034c19b03683da6e19b76d7'

// ================================
// CONFIGURATION IDs - Use Case IDs
// ================================
export const CONFIGURATION_ID_ERC20 =
    '0x0000000000000000000000000000000000000000000000000000000000000020'
export const CONFIGURATION_ID_ERC721 =
    '0x0000000000000000000000000000000000000000000000000000000000000721'
export const CONFIGURATION_ID_DID_REGISTRY =
    '0x00000000000000000000000000000000000000004449445F5245474953545259'
export const CONFIGURATION_ID_HASH_TIMESTAMP =
    '0x56209af0faa47cd136c87cbd8b739b3beb4ac51cbba6ec828e2ae8421365929e'

// ================================
// ARTIFACT PATHS - Contract Paths
// ================================
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
        'contracts/tokens/erc721/extension/burn/ERC721BurnableFacet.sol',
    ERC721_ENUMERABLE:
        'contracts/tokens/erc721/extension/enumerable/ERC721EnumerableFacet.sol',
    ERC721_CAPPED:
        'contracts/tokens/erc721/extension/cap/ERC721CappedFacet.sol',
    ERC721_CONTROLLER:
        'contracts/tokens/erc721/extension/controller/ERC721ControllerFacet.sol',
    ERC721_SNAPSHOT:
        'contracts/tokens/erc721/extension/snapshot/ERC721SnapshotFacet.sol',
    ERC721_ROYALTY:
        'contracts/tokens/erc721/extension/royalty/ERC721RoyaltyFacet.sol',

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
} as const

// ================================
// CONTRACT NAMES - Contract Names
// ================================
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

    // Utility facets
    HASH_TIMESTAMP: 'HashTimestampFacet',
    OWNABLE: 'Ownable2StepFacet',

    // DID Registry facets
    DID_DOCUMENT_DETAILED: 'DidDocumentDetailedFacet',
    DID_CONTROLLER: 'DidControllerFacet',
    DID_VERIFICATION_METHOD: 'DidVerificationMethodFacet',
    DID_VERIFICATION_RELATIONSHIP: 'DidVerificationRelationshipFacet',
} as const

// ================================
// BUSINESS LOGIC DEFINITIONS - Complete Definitions
// ================================
export const BUSINESS_LOGIC_DEFINITIONS = [
    // System base facets
    {
        description: 'IsbeCutFacet',
        key: ISBE_CUT_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ISBE_CUT,
        artifactPath: ARTIFACT_PATHS.ISBE_CUT,
    },
    {
        description: 'IsbeLoupeFacet',
        key: ISBE_LOUPE_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ISBE_LOUPE,
        artifactPath: ARTIFACT_PATHS.ISBE_LOUPE,
    },
    {
        description: 'AccessControlFacet',
        key: ACCESS_CONTROL_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ACCESS_CONTROL,
        artifactPath: ARTIFACT_PATHS.ACCESS_CONTROL,
    },
    {
        description: 'ISBEPauseFacet',
        key: PAUSE_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.PAUSE,
        artifactPath: ARTIFACT_PATHS.PAUSE,
    },

    // ERC20 facets
    {
        description: 'ERC20Facet',
        key: ERC20_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC20,
        artifactPath: ARTIFACT_PATHS.ERC20,
    },
    {
        description: 'ERC20SnapshotFacet',
        key: ERC20_SNAPSHOT_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC20_SNAPSHOT,
        artifactPath: ARTIFACT_PATHS.ERC20_SNAPSHOT,
    },
    {
        description: 'ERC20BurnableFacet',
        key: ERC20_BURNABLE_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC20_BURNABLE,
        artifactPath: ARTIFACT_PATHS.ERC20_BURNABLE,
    },
    {
        description: 'ERC20CappedFacet',
        key: ERC20_CAPPED_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC20_CAPPED,
        artifactPath: ARTIFACT_PATHS.ERC20_CAPPED,
    },
    {
        description: 'ERC20ControllerFacet',
        key: ERC20_CONTROLLER_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC20_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.ERC20_CONTROLLER,
    },

    // ERC721 facets
    {
        description: 'ERC721Facet',
        key: ERC721_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721,
        artifactPath: ARTIFACT_PATHS.ERC721,
    },
    {
        description: 'ERC721BurnableFacet',
        key: ERC721_BURNABLE_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721_BURNABLE,
        artifactPath: ARTIFACT_PATHS.ERC721_BURNABLE,
    },
    {
        description: 'ERC721EnumerableFacet',
        key: ERC721_ENUMERABLE_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721_ENUMERABLE,
        artifactPath: ARTIFACT_PATHS.ERC721_ENUMERABLE,
    },
    {
        description: 'ERC721CappedFacet',
        key: ERC721_CAPPED_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721_CAPPED,
        artifactPath: ARTIFACT_PATHS.ERC721_CAPPED,
    },
    {
        description: 'ERC721ControllerFacet',
        key: ERC721_CONTROLLER_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.ERC721_CONTROLLER,
    },
    {
        description: 'ERC721SnapshotFacet',
        key: ERC721_SNAPSHOT_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721_SNAPSHOT,
        artifactPath: ARTIFACT_PATHS.ERC721_SNAPSHOT,
    },
    {
        description: 'ERC721RoyaltyFacet',
        key: ERC721_ROYALTY_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.ERC721_ROYALTY,
        artifactPath: ARTIFACT_PATHS.ERC721_ROYALTY,
    },

    // Utility facets
    {
        description: 'HashTimestampFacet',
        key: HASH_TIMESTAMP_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.HASH_TIMESTAMP,
        artifactPath: ARTIFACT_PATHS.HASH_TIMESTAMP,
    },
    {
        description: 'OwnableFacet',
        key: OWNABLE_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.OWNABLE,
        artifactPath: ARTIFACT_PATHS.OWNABLE,
    },

    // DID Registry facets
    {
        description: 'DidDocumentDetailedFacet',
        key: DID_DOCUMENT_DETAILED_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.DID_DOCUMENT_DETAILED,
        artifactPath: ARTIFACT_PATHS.DID_DOCUMENT_DETAILED,
    },
    {
        description: 'DidControllerFacet',
        key: DID_CONTROLLER_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.DID_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.DID_CONTROLLER,
    },
    {
        description: 'DidVerificationMethodFacet',
        key: DID_VERIFICATION_METHOD_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.DID_VERIFICATION_METHOD,
        artifactPath: ARTIFACT_PATHS.DID_VERIFICATION_METHOD,
    },
    {
        description: 'DidVerificationRelationshipFacet',
        key: DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY,
        contractName: CONTRACT_NAMES.DID_VERIFICATION_RELATIONSHIP,
        artifactPath: ARTIFACT_PATHS.DID_VERIFICATION_RELATIONSHIP,
    },
] as const

// ================================
// USE CASE CONFIGURATIONS - Use Case Configurations
// ================================

// Complete ERC20 configuration
export const ERC20_USE_CASE_CONFIG = {
    description: 'ERC20 Complete UseCase',
    configurationId: CONFIGURATION_ID_ERC20,
    type: 'erc20',
    businessLogicKeys: [
        ERC20_SNAPSHOT_RESOLVER_KEY,
        ERC20_BURNABLE_RESOLVER_KEY,
        ERC20_CAPPED_RESOLVER_KEY,
        ERC20_CONTROLLER_RESOLVER_KEY,
        ERC20_RESOLVER_KEY,
    ],
    versions: Array(5).fill(DEFAULT_VERSION),
    rbacs: [],
    initPause: false,
    initBusinessIds: [],
    initCallData: [],
    isOwnable: false,
} as UseCaseConfig

// DID Registry configuration
export const DID_REGISTRY_USE_CASE_CONFIG = {
    description: 'DID Registry UseCase',
    configurationId: CONFIGURATION_ID_DID_REGISTRY,
    type: 'did_registry',
    businessLogicKeys: [
        DID_DOCUMENT_DETAILED_RESOLVER_KEY,
        DID_CONTROLLER_RESOLVER_KEY,
        DID_VERIFICATION_METHOD_RESOLVER_KEY,
        DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY,
    ],
    versions: Array(4).fill(DEFAULT_VERSION), // [0, 0, 0, 0, 0]
    rbacs: [],
    initPause: false,
    initBusinessIds: [],
    initCallData: [],
} as UseCaseConfig

// ERC721 configuration
export const ERC721_USE_CASE_CONFIG = {
    description: 'ERC721 UseCase',
    configurationId: CONFIGURATION_ID_ERC721,
    type: 'erc721',
    businessLogicKeys: [
        ERC721_RESOLVER_KEY,
        ERC721_BURNABLE_RESOLVER_KEY,
        ERC721_ENUMERABLE_RESOLVER_KEY,
        ERC721_CAPPED_RESOLVER_KEY,
        ERC721_CONTROLLER_RESOLVER_KEY,
        ERC721_SNAPSHOT_RESOLVER_KEY,
        ERC721_ROYALTY_RESOLVER_KEY,
    ],
    versions: Array(7).fill(DEFAULT_VERSION),
    rbacs: [],
    initPause: false,
    initBusinessIds: [],
    initCallData: [],
} as UseCaseConfig

// Hash Timestamp configuration
export const HASH_TIMESTAMP_USE_CASE_CONFIG = {
    description: 'Hash Timestamp UseCase',
    configurationId: CONFIGURATION_ID_HASH_TIMESTAMP,
    type: 'hash_timestamp',
    businessLogicKeys: [HASH_TIMESTAMP_RESOLVER_KEY],
    versions: Array(1).fill(DEFAULT_VERSION), // [0]
    rbacs: [],
    initPause: false,
    initBusinessIds: [],
    initCallData: [],
} as UseCaseConfig

// ================================
// DEFAULT CONFIGURATIONS - Default Configurations
// ================================
export const DEFAULT_USE_CASE_CONFIGURATIONS = [
    ERC20_USE_CASE_CONFIG,
    DID_REGISTRY_USE_CASE_CONFIG,
    ERC721_USE_CASE_CONFIG,
    HASH_TIMESTAMP_USE_CASE_CONFIG,
] as const

// ================================
// GOVERNANCE CONFIGURATION - Governance Configuration
// ================================
export const DEFAULT_GOVERNANCE_CONFIG = {
    accountAddress: process.env.ACCOUNT_ADDRESS,
    initData: '0x',
} as const
