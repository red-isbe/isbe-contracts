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
import { TokenConfiguration } from './types'
import {
    ERC20_RESOLVER_KEYS,
    ERC20_ERC3643_SHARED_RESOLVER_KEYS,
} from './resolverKeys'
import { CONFIGURATION_IDS } from './configurationIds'
import {
    createTokenConfig,
    generateTokenConfiguration,
    createBaseConfig,
} from './configHelpers'

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
    snapshot: [ERC20_RESOLVER_KEYS.SNAPSHOT],
    burnable: [ERC20_RESOLVER_KEYS.BURNABLE],
    capped: [ERC20_ERC3643_SHARED_RESOLVER_KEYS.CAPPED],
    controller: [ERC20_ERC3643_SHARED_RESOLVER_KEYS.CONTROLLER],
}

// Generate configurations
export const ERC20_CONFIGURATIONS = {
    // Base configuration
    BASE: BASE_ERC20_CONFIG,

    // Single extension configurations
    WITH_SNAPSHOT: createERC20Config([...extensions.snapshot]),
    WITH_BURNABLE: createERC20Config([...extensions.burnable]),
    WITH_CAPPED: createERC20Config([...extensions.capped]),
    WITH_CONTROLLER: createERC20Config([...extensions.controller]),

    // Double Extensions
    BURNABLE_SNAPSHOT: createERC20Config([
        ...extensions.burnable,
        ...extensions.snapshot,
    ]),
    BURNABLE_CAPPED: createERC20Config([
        ...extensions.burnable,
        ...extensions.capped,
    ]),
    BURNABLE_CONTROLLER: createERC20Config([
        ...extensions.burnable,
        ...extensions.controller,
    ]),
    SNAPSHOT_CAPPED: createERC20Config([
        ...extensions.snapshot,
        ...extensions.capped,
    ]),
    SNAPSHOT_CONTROLLER: createERC20Config([
        ...extensions.snapshot,
        ...extensions.controller,
    ]),
    CAPPED_CONTROLLER: createERC20Config([
        ...extensions.capped,
        ...extensions.controller,
    ]),

    // Triple Extensions
    BURNABLE_SNAPSHOT_CAPPED: createERC20Config([
        ...extensions.burnable,
        ...extensions.snapshot,
        ...extensions.capped,
    ]),
    BURNABLE_SNAPSHOT_CONTROLLER: createERC20Config([
        ...extensions.burnable,
        ...extensions.snapshot,
        ...extensions.controller,
    ]),
    BURNABLE_CAPPED_CONTROLLER: createERC20Config([
        ...extensions.burnable,
        ...extensions.capped,
        ...extensions.controller,
    ]),
    SNAPSHOT_CAPPED_CONTROLLER: createERC20Config([
        ...extensions.snapshot,
        ...extensions.capped,
        ...extensions.controller,
    ]),

    // Four extensions (complete)
    COMPLETE: createERC20Config([
        ...extensions.burnable,
        ...extensions.snapshot,
        ...extensions.capped,
        ...extensions.controller,
    ]),
} as const

// Use case configurations
export const ERC20_USE_CASE_CONFIGS = {
    // Base and single extensions
    BASE: createTokenConfig(ERC20_CONFIGURATIONS.BASE, 'erc20', 'ERC20 Base'),
    WITH_SNAPSHOT: createTokenConfig(
        ERC20_CONFIGURATIONS.WITH_SNAPSHOT,
        'erc20',
        'ERC20 w/Snap'
    ),
    WITH_BURNABLE: createTokenConfig(
        ERC20_CONFIGURATIONS.WITH_BURNABLE,
        'erc20',
        'ERC20 w/Burn'
    ),
    WITH_CAPPED: createTokenConfig(
        ERC20_CONFIGURATIONS.WITH_CAPPED,
        'erc20',
        'ERC20 w/Cap'
    ),
    WITH_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.WITH_CONTROLLER,
        'erc20',
        'ERC20 w/Ctrl'
    ),

    // Double combinations
    BURNABLE_SNAPSHOT: createTokenConfig(
        ERC20_CONFIGURATIONS.BURNABLE_SNAPSHOT,
        'erc20',
        'ERC20 w/Burn & Snap'
    ),
    BURNABLE_CAPPED: createTokenConfig(
        ERC20_CONFIGURATIONS.BURNABLE_CAPPED,
        'erc20',
        'ERC20 w/Burn & Cap'
    ),
    BURNABLE_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.BURNABLE_CONTROLLER,
        'erc20',
        'ERC20 w/Burn & Ctrl'
    ),
    SNAPSHOT_CAPPED: createTokenConfig(
        ERC20_CONFIGURATIONS.SNAPSHOT_CAPPED,
        'erc20',
        'ERC20 w/Snap & Cap'
    ),
    SNAPSHOT_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.SNAPSHOT_CONTROLLER,
        'erc20',
        'ERC20 w/Snap & Ctrl'
    ),
    CAPPED_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.CAPPED_CONTROLLER,
        'erc20',
        'ERC20 w/Cap & Ctrl'
    ),

    // Triple combinations
    BURNABLE_SNAPSHOT_CAPPED: createTokenConfig(
        ERC20_CONFIGURATIONS.BURNABLE_SNAPSHOT_CAPPED,
        'erc20',
        'ERC20 w/Burn & Snap & Cap'
    ),
    BURNABLE_SNAPSHOT_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.BURNABLE_SNAPSHOT_CONTROLLER,
        'erc20',
        'ERC20 w/Burn & Snap & Ctrl'
    ),
    BURNABLE_CAPPED_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.BURNABLE_CAPPED_CONTROLLER,
        'erc20',
        'ERC20 w/Burn & Cap & Ctrl'
    ),
    SNAPSHOT_CAPPED_CONTROLLER: createTokenConfig(
        ERC20_CONFIGURATIONS.SNAPSHOT_CAPPED_CONTROLLER,
        'erc20',
        'ERC20 w/Snap & Cap & Ctrl'
    ),

    // Complete (Four extensions)
    COMPLETE: createTokenConfig(
        ERC20_CONFIGURATIONS.COMPLETE,
        'erc20',
        'ERC20 Complete'
    ),
}
