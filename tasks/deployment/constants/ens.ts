import { ENS_RESOLVER_KEYS } from './resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from './configurationIds'

import { createTokenConfig } from './configHelpers'
import { CONFIGURATION_IDS } from './configurationIds'

// ENS Registry configurations
export const ENS_REGISTRY_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [ENS_RESOLVER_KEYS.REGISTRY],
        id: CONFIGURATION_IDS.ENS_REGISTRY,
    },
}

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
    REGISTRY: createTokenConfig(
        ENS_REGISTRY_CONFIGURATIONS.BASE,
        'ens',
        'ENS Registry'
    ),
    PUBLIC_RESOLVER: createTokenConfig(
        ENS_PUBLIC_RESOLVER_CONFIGURATIONS.BASE,
        'ens',
        'ENS Public Resolver'
    ),
}

// Business logic definitions
export const ENS_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ENS_REGISTRY,
        key: ENS_RESOLVER_KEYS.REGISTRY,
        contractName: CONTRACT_NAMES.ENS_REGISTRY,
        artifactPath: ARTIFACT_PATHS.ENS_REGISTRY,
    },
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
