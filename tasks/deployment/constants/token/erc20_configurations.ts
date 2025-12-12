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
import { ERC20_RESOLVER_KEYS, WHITELIST_RESOLVER_KEYS } from '../resolverKeys'
import { CONFIGURATION_IDS } from '../configurationIds'
import {
    createTokenConfig,
    generateTokenConfiguration,
    createBaseConfig,
} from '../configHelpers'

// Helper function to create ERC20 configurations
function createERC20Config(keys: string[]): TokenConfiguration {
    return generateTokenConfiguration(
        ERC20_RESOLVER_KEYS.ERC20,
        CONFIGURATION_IDS.ERC20,
        keys
    )
}

// Base configuration
export const BASE_ERC20_CONFIG = createBaseConfig(
    ERC20_RESOLVER_KEYS.ERC20,
    CONFIGURATION_IDS.ERC20
)

// Extensions requiring ERC20 base
const extensions = {
    base: [ERC20_RESOLVER_KEYS.ERC20],
    burnable: [ERC20_RESOLVER_KEYS.BURNABLE],
    snapshot: [ERC20_RESOLVER_KEYS.SNAPSHOT],
    capped: [ERC20_RESOLVER_KEYS.CAPPED],
    controller: [ERC20_RESOLVER_KEYS.CONTROLLER],
    whitelist: [WHITELIST_RESOLVER_KEYS.BASIC_WHITELIST],
}

// Generate configurations
export const ERC20_USE_CASE_CONFIGS = {
    // Base configuration
    BASE: createTokenConfig(
        createERC20Config([...extensions.base]),
        'erc20',
        'ERC20 Base'
    ),

    // Single extension combinations
    WITH_BURNABLE: createTokenConfig(
        createERC20Config([...extensions.base, ...extensions.burnable]),
        'erc20',
        'ERC20 w/Burn'
    ),
    WITH_SNAPSHOT: createTokenConfig(
        createERC20Config([...extensions.base, ...extensions.snapshot]),
        'erc20',
        'ERC20 w/Snap'
    ),
    WITH_CAPPED: createTokenConfig(
        createERC20Config([...extensions.base, ...extensions.capped]),
        'erc20',
        'ERC20 w/Cap'
    ),
    WITH_CONTROLLER: createTokenConfig(
        createERC20Config([...extensions.base, ...extensions.controller]),
        'erc20',
        'ERC20 w/Ctrl'
    ),
    WITH_WHITELIST: createTokenConfig(
        createERC20Config([...extensions.base, ...extensions.whitelist]),
        'erc20',
        'ERC20 w/Whitelist'
    ),

    // Two extension combinations
    // Burnable combinations
    BURNABLE_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Burn & Snap'
    ),
    BURNABLE_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Burn & Cap'
    ),
    BURNABLE_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Burn & Ctrl'
    ),

    // Snapshot combinations
    SNAPSHOT_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Snap & Burn'
    ),
    SNAPSHOT_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Snap & Cap'
    ),
    SNAPSHOT_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Snap & Ctrl'
    ),

    // Capped combinations
    CAPPED_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Cap & Burn'
    ),
    CAPPED_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Cap & Snap'
    ),
    CAPPED_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Cap & Ctrl'
    ),

    // Controller combinations
    CONTROLLER_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Burn'
    ),
    CONTROLLER_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Snap'
    ),
    CONTROLLER_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Cap'
    ),

    // Three extension combinations
    // Burnable combinations
    BURNABLE_SNAPSHOT_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Burn & Snap & Cap'
    ),
    BURNABLE_SNAPSHOT_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Burn & Snap & Ctrl'
    ),
    BURNABLE_CAPPED_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Burn & Cap & Snap'
    ),
    BURNABLE_CAPPED_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Burn & Cap & Ctrl'
    ),
    BURNABLE_CONTROLLER_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Burn & Ctrl & Snap'
    ),
    BURNABLE_CONTROLLER_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.controller,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Burn & Ctrl & Cap'
    ),

    // Snapshot combinations
    SNAPSHOT_BURNABLE_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.burnable,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Snap & Burn & Cap'
    ),
    SNAPSHOT_BURNABLE_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.burnable,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Snap & Burn & Ctrl'
    ),
    SNAPSHOT_CAPPED_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.capped,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Snap & Cap & Burn'
    ),
    SNAPSHOT_CAPPED_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Snap & Cap & Ctrl'
    ),
    SNAPSHOT_CONTROLLER_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.controller,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Snap & Ctrl & Burn'
    ),
    SNAPSHOT_CONTROLLER_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.snapshot,
            ...extensions.controller,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Snap & Ctrl & Cap'
    ),

    // Capped combinations
    CAPPED_BURNABLE_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.burnable,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Cap & Burn & Snap'
    ),
    CAPPED_BURNABLE_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.burnable,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Cap & Burn & Ctrl'
    ),
    CAPPED_SNAPSHOT_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Cap & Snap & Burn'
    ),
    CAPPED_SNAPSHOT_CONTROLLER: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.snapshot,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 w/Cap & Snap & Ctrl'
    ),
    CAPPED_CONTROLLER_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Cap & Ctrl & Burn'
    ),
    CAPPED_CONTROLLER_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.capped,
            ...extensions.controller,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Cap & Ctrl & Snap'
    ),

    // Controller combinations
    CONTROLLER_BURNABLE_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.burnable,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Burn & Snap'
    ),
    CONTROLLER_BURNABLE_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.burnable,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Burn & Cap'
    ),
    CONTROLLER_SNAPSHOT_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Snap & Burn'
    ),
    CONTROLLER_SNAPSHOT_CAPPED: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.snapshot,
            ...extensions.capped,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Snap & Cap'
    ),
    CONTROLLER_CAPPED_BURNABLE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.capped,
            ...extensions.burnable,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Cap & Burn'
    ),
    CONTROLLER_CAPPED_SNAPSHOT: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.controller,
            ...extensions.capped,
            ...extensions.snapshot,
        ]),
        'erc20',
        'ERC20 w/Ctrl & Cap & Snap'
    ),

    // Complete (all four extensions)
    COMPLETE: createTokenConfig(
        createERC20Config([
            ...extensions.base,
            ...extensions.burnable,
            ...extensions.snapshot,
            ...extensions.capped,
            ...extensions.controller,
        ]),
        'erc20',
        'ERC20 Complete'
    ),
}
