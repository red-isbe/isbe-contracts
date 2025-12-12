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
import { TokenConfiguration } from '../types'
import { ERC721_RESOLVER_KEYS } from '../resolverKeys'
import { CONFIGURATION_IDS } from '../configurationIds'
import {
    createTokenConfig,
    generateTokenConfiguration,
    createBaseConfig,
} from '../configHelpers'

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
export const ERC721_USE_CASE_CONFIGS = {
    // Base configuration
    BASE: createTokenConfig(
        createERC721Config([...extensions.base]),
        'erc721',
        'ERC721 Base'
    ),

    // Single extension combinations
    WITH_BURNABLE: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.burnable]),
        'erc721',
        'ERC721 w/Burn'
    ),
    WITH_ENUMERABLE: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.enumerable]),
        'erc721',
        'ERC721 w/Enum'
    ),
    WITH_CAPPED: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.capped]),
        'erc721',
        'ERC721 w/Cap'
    ),
    WITH_CONTROLLER: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.controller]),
        'erc721',
        'ERC721 w/Ctrl'
    ),
    WITH_SNAPSHOT: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.snapshot]),
        'erc721',
        'ERC721 w/Snap'
    ),
    WITH_ROYALTY: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.royalty]),
        'erc721',
        'ERC721 w/Royal'
    ),
    WITH_CONSECUTIVE: createTokenConfig(
        createERC721Config([...extensions.base, ...extensions.consecutive]),
        'erc721',
        'ERC721 w/Cons'
    ),

    // Two extension combinations
    // Burnable combinations
    BURN_ENUM: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum'
    ),
    BURN_CAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap'
    ),
    BURN_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl'
    ),
    BURN_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap'
    ),
    BURN_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Royal'
    ),
    BURN_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cons'
    ),

    // Enumerable combinations
    ENUM_CAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap'
    ),
    ENUM_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl'
    ),
    ENUM_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Enum & Snap'
    ),
    ENUM_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Royal'
    ),
    ENUM_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cons'
    ),

    // Capped combinations
    CAP_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl'
    ),
    CAP_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Cap & Snap'
    ),
    CAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Cap & Royal'
    ),
    CAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Cons'
    ),

    // Controller combinations
    CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Snap'
    ),
    CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Royal'
    ),
    CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Cons'
    ),

    // Snapshot combinations
    SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Snap & Royal'
    ),
    SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Snap & Cons'
    ),

    // Royalty combinations
    ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Royal & Cons'
    ),

    // Three extension combinations
    // Burnable combinations (existing)
    BURN_ENUM_CAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap'
    ),
    BURN_ENUM_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Ctrl'
    ),
    BURN_ENUM_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Snap'
    ),
    BURN_ENUM_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Royal'
    ),
    BURN_ENUM_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cons'
    ),
    BURN_CAP_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Ctrl'
    ),
    BURN_CAP_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Snap'
    ),
    BURN_CAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Royal'
    ),
    BURN_CAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Cons'
    ),
    BURN_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Snap'
    ),
    BURN_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Royal'
    ),
    BURN_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Cons'
    ),
    BURN_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap & Royal'
    ),
    BURN_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Snap & Cons'
    ),

    BURN_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Royal & Cons'
    ),

    ENUM_CAP_CTRL: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Ctrl'
    ),
    ENUM_CAP_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Snap'
    ),
    ENUM_CAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Royal'
    ),
    ENUM_CAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Cons'
    ),
    ENUM_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Snap'
    ),
    ENUM_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Royal'
    ),
    ENUM_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Cons'
    ),
    ENUM_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Enum & Snap & Royal'
    ),
    ENUM_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Snap & Cons'
    ),
    ENUM_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Royal & Cons'
    ),

    CAP_CTRL_SNAP: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Snap'
    ),
    CAP_CTRL_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Royal'
    ),
    CAP_CTRL_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Ctrl & Cons'
    ),
    CAP_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Cap & Snap & Royal'
    ),
    CAP_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Snap & Cons'
    ),
    CAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Cap & Royal & Cons'
    ),

    CTRL_SNAP_ROY: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Snap & Royal'
    ),
    CTRL_SNAP_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Snap & Cons'
    ),
    CTRL_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Ctrl & Royal & Cons'
    ),

    SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Snap & Royal & Cons'
    ),

    // ----- 4-extension -----
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
    BURN_CTRL_SNAP_ROY: createTokenConfig(
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
    BURN_CTRL_SNAP_CONS: createTokenConfig(
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
    BURN_CTRL_ROY_CONS: createTokenConfig(
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
    BURN_SNAP_ROY_CONS: createTokenConfig(
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

    // ----- 5-extension -----
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
    BURN_ENUM_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Snap & Royal & Cons'
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
    BURN_CAP_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Cap & Snap & Royal & Cons'
    ),
    BURN_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Ctrl & Snap & Royal & Cons'
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
    ENUM_CAP_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Cap & Snap & Royal & Cons'
    ),
    ENUM_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.enumerable,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Enum & Ctrl & Snap & Royal & Cons'
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

    // ----- 6-extension -----
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

    // ----- 7-extension -----
    BURN_ENUM_CAP_CTRL_SNAP_ROY_CONS: createTokenConfig(
        createERC721Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.enumerable,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.royalty,
            ...extensions.consecutive,
        ]),
        'erc721',
        'ERC721 w/Burn & Enum & Cap & Ctrl & Snap & Royal & Cons'
    ),
}
