import { ENS_RESOLVER_KEYS } from './resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from './configurationIds'

import { createTokenConfig } from './configHelpers'
import { CONFIGURATION_IDS } from './configurationIds'

// ENS Public Resolver configurations
export const ENS_PUBLIC_RESOLVER_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [
            ENS_RESOLVER_KEYS.RESOLVER,
            ENS_RESOLVER_KEYS.NAME_RESOLVER,
            ENS_RESOLVER_KEYS.TEXT_RESOLVER,
            ENS_RESOLVER_KEYS.PUBKEY_RESOLVER,
        ],
        id: CONFIGURATION_IDS.ENS_PUBLIC_RESOLVER,
    },
}

// Use case configurations
export const ENS_USE_CASE_CONFIGS = {
    PUBLIC_RESOLVER: createTokenConfig(
        ENS_PUBLIC_RESOLVER_CONFIGURATIONS.BASE,
        'ens',
        'ENS Public Resolver'
    ),
}

// Business logic definitions
export const ENS_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ENS_RESOLVER,
        key: ENS_RESOLVER_KEYS.RESOLVER,
        contractName: CONTRACT_NAMES.ENS_RESOLVER,
        artifactPath: ARTIFACT_PATHS.ENS_RESOLVER,
    },
    {
        description: CONTRACT_NAMES.ENS_NAME_RESOLVER,
        key: ENS_RESOLVER_KEYS.NAME_RESOLVER,
        contractName: CONTRACT_NAMES.ENS_NAME_RESOLVER,
        artifactPath: ARTIFACT_PATHS.ENS_NAME_RESOLVER,
    },
    {
        description: CONTRACT_NAMES.ENS_TEXT_RESOLVER,
        key: ENS_RESOLVER_KEYS.TEXT_RESOLVER,
        contractName: CONTRACT_NAMES.ENS_TEXT_RESOLVER,
        artifactPath: ARTIFACT_PATHS.ENS_TEXT_RESOLVER,
    },
    {
        description: CONTRACT_NAMES.ENS_PUBKEY_RESOLVER,
        key: ENS_RESOLVER_KEYS.PUBKEY_RESOLVER,
        contractName: CONTRACT_NAMES.ENS_PUBKEY_RESOLVER,
        artifactPath: ARTIFACT_PATHS.ENS_PUBKEY_RESOLVER,
    },
]
