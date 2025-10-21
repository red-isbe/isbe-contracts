import { TokenConfiguration } from './types'
import { ERC721_RESOLVER_KEYS } from './resolverKeys'
import { CONFIGURATION_IDS } from './configurationIds'
import {
    createTokenConfig,
    generateTokenConfiguration,
    createBaseConfig,
} from './configHelpers'

// Helper function to create ERC721 configurations
function createERC721Config(keys: string[]): TokenConfiguration {
    return generateTokenConfiguration(
        ERC721_RESOLVER_KEYS.ERC721,
        CONFIGURATION_IDS.ERC721,
        keys
    )
}

// Base configuration
export const BASE_ERC721_CONFIG = createBaseConfig(
    ERC721_RESOLVER_KEYS.ERC721,
    CONFIGURATION_IDS.ERC721
)

// Extensions requiring ERC721 base
const extensions = {
    base: [ERC721_RESOLVER_KEYS.ERC721],
    burnable: [ERC721_RESOLVER_KEYS.BURNABLE],
    enumerable: [ERC721_RESOLVER_KEYS.ENUMERABLE],
    capped: [ERC721_RESOLVER_KEYS.CAPPED],
    controller: [ERC721_RESOLVER_KEYS.CONTROLLER],
    snapshot: [ERC721_RESOLVER_KEYS.SNAPSHOT],
    royalty: [ERC721_RESOLVER_KEYS.ROYALTY],
    consecutive: [ERC721_RESOLVER_KEYS.CONSECUTIVE],
}

// Generate configurations
export const ERC721_CONFIGURATIONS = {
    // Base configuration
    BASE: BASE_ERC721_CONFIG,

    // Single extension configurations
    WITH_BURNABLE: createERC721Config(extensions.burnable),
    WITH_ENUMERABLE: createERC721Config(extensions.enumerable),
    WITH_CAPPED: createERC721Config(extensions.capped),
    WITH_CONTROLLER: createERC721Config(extensions.controller),
    WITH_SNAPSHOT: createERC721Config(extensions.snapshot),
    WITH_ROYALTY: createERC721Config(extensions.royalty),
    WITH_CONSECUTIVE: createERC721Config(extensions.consecutive),

    // Two extension configurations
    BURNABLE_ENUMERABLE: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
    ]),
    BURNABLE_CAPPED: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
    ]),
    BURNABLE_CONTROLLER: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
    ]),
    BURNABLE_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.snapshot,
    ]),
    BURNABLE_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.royalty,
    ]),
    BURNABLE_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_CAPPED: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
    ]),
    ENUMERABLE_CONTROLLER: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
    ]),
    ENUMERABLE_SNAPSHOT: createERC721Config([
        ...extensions.enumerable,
        ...extensions.snapshot,
    ]),
    ENUMERABLE_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.royalty,
    ]),
    ENUMERABLE_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.consecutive,
    ]),
    CAPPED_CONTROLLER: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
    ]),
    CAPPED_SNAPSHOT: createERC721Config([
        ...extensions.capped,
        ...extensions.snapshot,
    ]),
    CAPPED_ROYALTY: createERC721Config([
        ...extensions.capped,
        ...extensions.royalty,
    ]),
    CAPPED_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.consecutive,
    ]),
    CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // Three extension combinations
    // BURN combinations
    BURNABLE_ENUMERABLE_CAPPED: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
    ]),
    BURNABLE_ENUMERABLE_CONTROLLER: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
    ]),
    BURNABLE_ENUMERABLE_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.snapshot,
    ]),
    BURNABLE_ENUMERABLE_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.royalty,
    ]),
    BURNABLE_ENUMERABLE_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.consecutive,
    ]),
    BURNABLE_CAPPED_CONTROLLER: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
    ]),
    BURNABLE_CAPPED_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.snapshot,
    ]),
    BURNABLE_CAPPED_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.royalty,
    ]),
    BURNABLE_CAPPED_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.consecutive,
    ]),
    BURNABLE_CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    BURNABLE_CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    BURNABLE_CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    BURNABLE_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURNABLE_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURNABLE_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // ENUM combinations
    ENUMERABLE_CAPPED_CONTROLLER: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
    ]),
    ENUMERABLE_CAPPED_SNAPSHOT: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
    ]),
    ENUMERABLE_CAPPED_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.royalty,
    ]),
    ENUMERABLE_CAPPED_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    ENUMERABLE_CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    ENUMERABLE_CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    ENUMERABLE_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // CAP combinations
    CAPPED_CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    CAPPED_CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    CAPPED_CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    CAPPED_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    CAPPED_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    CAPPED_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // CTRL combinations
    CONTROLLER_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    CONTROLLER_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    CONTROLLER_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // SNAP combinations
    SNAPSHOT_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // Four extension combinations
    // BURN + ENUM combinations
    BURNABLE_ENUMERABLE_CAPPED_CONTROLLER: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
    ]),
    BURNABLE_ENUMERABLE_CAPPED_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
    ]),
    BURNABLE_ENUMERABLE_CAPPED_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.royalty,
    ]),
    BURNABLE_ENUMERABLE_CAPPED_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.consecutive,
    ]),
    BURNABLE_ENUMERABLE_CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    BURNABLE_ENUMERABLE_CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    BURNABLE_ENUMERABLE_CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    BURNABLE_ENUMERABLE_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURNABLE_ENUMERABLE_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURNABLE_ENUMERABLE_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // BURN + CAP combinations
    BURNABLE_CAPPED_CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    BURNABLE_CAPPED_CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    BURNABLE_CAPPED_CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    BURNABLE_CAPPED_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURNABLE_CAPPED_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURNABLE_CAPPED_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // BURN + CTRL combinations
    BURNABLE_CONTROLLER_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURNABLE_CONTROLLER_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURNABLE_CONTROLLER_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // BURN + SNAP combinations
    BURNABLE_SNAPSHOT_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.burnable,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // ENUM + CAP combinations
    ENUMERABLE_CAPPED_CONTROLLER_SNAPSHOT: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    ENUMERABLE_CAPPED_CONTROLLER_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    ENUMERABLE_CAPPED_CONTROLLER_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_CAPPED_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    ENUMERABLE_CAPPED_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_CAPPED_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // ENUM + CTRL combinations
    ENUMERABLE_CONTROLLER_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    ENUMERABLE_CONTROLLER_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    ENUMERABLE_CONTROLLER_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // ENUM + SNAP combinations
    ENUMERABLE_SNAPSHOT_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.enumerable,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // CAP + CTRL combinations
    CAPPED_CONTROLLER_SNAPSHOT_ROYALTY: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    CAPPED_CONTROLLER_SNAPSHOT_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    CAPPED_CONTROLLER_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // CAP + SNAP combinations
    CAPPED_SNAPSHOT_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // CTRL + SNAP combinations
    CONTROLLER_SNAPSHOT_ROYALTY_CONSECUTIVE: createERC721Config([
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // Five extension combinations
    BURN_ENUM_CAP_CTRL_SNAP: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
    ]),
    BURN_ENUM_CAP_CTRL_ROY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
    ]),
    BURN_ENUM_CAP_CTRL_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CAP_SNAP_ROY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURN_ENUM_CAP_SNAP_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CAP_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CTRL_SNAP_ROY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURN_ENUM_CTRL_SNAP_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CTRL_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    BURN_CAP_CTRL_SNAP_ROY: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURN_CAP_CTRL_SNAP_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURN_CAP_CTRL_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    ENUM_CAP_CTRL_SNAP_ROY: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    ENUM_CAP_CTRL_SNAP_CONS: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    ENUM_CAP_CTRL_ROY_CONS: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    CAP_CTRL_SNAP_ROY_CONS: createERC721Config([
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // Six extension combinations
    BURN_ENUM_CAP_CTRL_SNAP_ROY: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
    ]),
    BURN_ENUM_CAP_CTRL_SNAP_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CAP_CTRL_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CAP_SNAP_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    BURN_ENUM_CTRL_SNAP_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    BURN_CAP_CTRL_SNAP_ROY_CONS: createERC721Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
    ENUM_CAP_CTRL_SNAP_ROY_CONS: createERC721Config([
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),

    // Seven extension combinations
    BURN_ENUM_CAP_CTRL_SNAP_ROY_CONS: createERC721Config([
        ...extensions.base,
        ...extensions.burnable,
        ...extensions.enumerable,
        ...extensions.capped,
        ...extensions.controller,
        ...extensions.snapshot,
        ...extensions.royalty,
        ...extensions.consecutive,
    ]),
} as const

// Use case configurations
export const ERC721_USE_CASE_CONFIGS = {
    // Base configuration
    BASE: createTokenConfig(
        createERC721Config([...extensions.base]),
        'erc721',
        'ERC721 Base'
    ),

    // Single extension combinations
    WITH_BURNABLE: createTokenConfig(
        createERC721Config([...extensions.burnable]),
        'erc721',
        'ERC721 w/Burn'
    ),
    WITH_ENUMERABLE: createTokenConfig(
        createERC721Config([...extensions.enumerable]),
        'erc721',
        'ERC721 w/Enum'
    ),
    WITH_CAPPED: createTokenConfig(
        createERC721Config([...extensions.capped]),
        'erc721',
        'ERC721 w/Cap'
    ),
    WITH_CONTROLLER: createTokenConfig(
        createERC721Config([...extensions.controller]),
        'erc721',
        'ERC721 w/Ctrl'
    ),
    WITH_SNAPSHOT: createTokenConfig(
        createERC721Config([...extensions.snapshot]),
        'erc721',
        'ERC721 w/Snap'
    ),
    WITH_ROYALTY: createTokenConfig(
        createERC721Config([...extensions.royalty]),
        'erc721',
        'ERC721 w/Royal'
    ),
    WITH_CONSECUTIVE: createTokenConfig(
        createERC721Config([...extensions.consecutive]),
        'erc721',
        'ERC721 w/Cons'
    ),

    // Two extension combinations
    BURNABLE_ENUMERABLE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum'
    ),
    BURNABLE_CAPPED: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap'
    ),
    BURNABLE_CONTROLLER: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl'
    ),
    BURNABLE_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap'
    ),
    BURNABLE_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Royal'
    ),
    BURNABLE_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cons'
    ),

    // Three extension combinations
    // BURN combinations
    BURNABLE_ENUMERABLE_CAPPED: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap'
    ),
    BURNABLE_ENUMERABLE_CONTROLLER: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl'
    ),
    BURNABLE_ENUMERABLE_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Snap'
    ),
    BURNABLE_ENUMERABLE_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Royal'
    ),
    BURNABLE_ENUMERABLE_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cons'
    ),
    BURNABLE_CAPPED_CONTROLLER: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl'
    ),
    BURNABLE_CAPPED_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Snap'
    ),
    BURNABLE_CAPPED_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Royal'
    ),
    BURNABLE_CAPPED_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Cons'
    ),
    BURNABLE_CONTROLLER_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Snap'
    ),
    BURNABLE_CONTROLLER_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Royal'
    ),
    BURNABLE_CONTROLLER_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Cons'
    ),
    BURNABLE_SNAPSHOT_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap & Royal'
    ),
    BURNABLE_SNAPSHOT_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap & Cons'
    ),
    BURNABLE_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Royal & Cons'
    ),

    // ENUM combinations
    ENUMERABLE_CAPPED_CONTROLLER: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl'
    ),
    ENUMERABLE_CAPPED_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Snap'
    ),
    ENUMERABLE_CAPPED_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Royal'
    ),
    ENUMERABLE_CAPPED_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Cons'
    ),
    ENUMERABLE_CONTROLLER_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Snap'
    ),
    ENUMERABLE_CONTROLLER_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Royal'
    ),
    ENUMERABLE_CONTROLLER_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Cons'
    ),
    ENUMERABLE_SNAPSHOT_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Snap & Royal'
    ),
    ENUMERABLE_SNAPSHOT_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Snap & Cons'
    ),
    ENUMERABLE_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Royal & Cons'
    ),

    // CAP combinations
    CAPPED_CONTROLLER_SNAPSHOT: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Snap'
    ),
    CAPPED_CONTROLLER_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Royal'
    ),
    CAPPED_CONTROLLER_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Cons'
    ),
    CAPPED_SNAPSHOT_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Cap & Snap & Royal'
    ),
    CAPPED_SNAPSHOT_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Snap & Cons'
    ),
    CAPPED_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Royal & Cons'
    ),

    // CTRL combinations
    CONTROLLER_SNAPSHOT_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Snap & Royal'
    ),
    CONTROLLER_SNAPSHOT_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Snap & Cons'
    ),
    CONTROLLER_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Royal & Cons'
    ),

    // SNAP combinations
    SNAPSHOT_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Snap & Royal & Cons'
    ),

    // Four extension combinations
    // BURN + ENUM combinations
    BURN_ENUM_CAP_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl'
    ),
    BURN_ENUM_CAP_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Snap'
    ),
    BURN_ENUM_CAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Royal'
    ),
    BURN_ENUM_CAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Cons'
    ),
    BURN_ENUM_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Snap'
    ),
    BURN_ENUM_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Royal'
    ),
    BURN_ENUM_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Cons'
    ),
    BURN_ENUM_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Snap & Royal'
    ),
    BURN_ENUM_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Snap & Cons'
    ),
    BURN_ENUM_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Royal & Cons'
    ),

    // BURN + CAP combinations
    BURN_CAP_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Snap'
    ),
    BURN_CAP_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Royal'
    ),
    BURN_CAP_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Cons'
    ),
    BURN_CAP_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Snap & Royal'
    ),
    BURN_CAP_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Snap & Cons'
    ),
    BURN_CAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Royal & Cons'
    ),

    // BURN + CTRL combinations
    BURNABLE_CONTROLLER_SNAPSHOT_ROYALTY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Snap & Royal'
    ),
    BURNABLE_CONTROLLER_SNAPSHOT_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Snap & Cons'
    ),
    BURNABLE_CONTROLLER_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Royal & Cons'
    ),

    // BURN + SNAP combinations
    BURNABLE_SNAPSHOT_ROYALTY_CONSECUTIVE: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap & Royal & Cons'
    ),

    // ENUM + CAP combinations
    ENUM_CAP_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Snap'
    ),
    ENUM_CAP_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Royal'
    ),
    ENUM_CAP_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Cons'
    ),
    ENUM_CAP_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Snap & Royal'
    ),
    ENUM_CAP_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Snap & Cons'
    ),
    ENUM_CAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Royal & Cons'
    ),

    // ENUM + CTRL combinations
    ENUM_CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Snap & Royal'
    ),
    ENUM_CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Snap & Cons'
    ),
    ENUM_CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Royal & Cons'
    ),

    // ENUM + SNAP combinations
    ENUM_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Snap & Royal & Cons'
    ),

    // CAP + CTRL combinations
    CAP_CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Snap & Royal'
    ),
    CAP_CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Snap & Cons'
    ),
    CAP_CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Royal & Cons'
    ),

    // CAP + SNAP combinations
    CAP_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Snap & Royal & Cons'
    ),

    // CTRL + SNAP combinations
    CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Snap & Royal & Cons'
    ),

    // 5 Extension combinations
    BURN_ENUM_CAP_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Snap'
    ),
    BURN_ENUM_CAP_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Royal'
    ),
    BURN_ENUM_CAP_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Cons'
    ),
    BURN_ENUM_CAP_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Snap & Royal'
    ),
    BURN_ENUM_CAP_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Snap & Cons'
    ),
    BURN_ENUM_CAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Royal & Cons'
    ),
    BURN_ENUM_CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Snap & Royal'
    ),
    BURN_ENUM_CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Snap & Cons'
    ),
    BURN_ENUM_CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Royal & Cons'
    ),
    BURN_CAP_CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Snap & Royal'
    ),
    BURN_CAP_CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Snap & Cons'
    ),
    BURN_CAP_CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Royal & Cons'
    ),
    ENUM_CAP_CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Snap & Royal'
    ),
    ENUM_CAP_CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Snap & Cons'
    ),
    ENUM_CAP_CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Royal & Cons'
    ),
    CAP_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Snap & Royal & Cons'
    ),

    // Six extension combinations
    BURN_ENUM_CAP_CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Snap & Royal'
    ),
    BURN_ENUM_CAP_CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Snap & Cons'
    ),
    BURN_ENUM_CAP_CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Royal & Cons'
    ),
    BURN_ENUM_CAP_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Snap & Royal & Cons'
    ),
    BURN_ENUM_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl & Snap & Royal & Cons'
    ),
    BURN_CAP_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl & Snap & Royal & Cons'
    ),
    ENUM_CAP_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl & Snap & Royal & Cons'
    ),
}
