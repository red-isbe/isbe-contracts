import {
    CLIENT_RESOLVER_KEYS,
    BESU_NODE_MANAGER_RESOLVER_KEYS,
} from './resolverKeys'
import {
    CONFIGURATION_IDS,
    ARTIFACT_PATHS,
    CONTRACT_NAMES,
} from './configurationIds'
import { createTokenConfig } from './configHelpers'

// Client Filtering configurations
export const CLIENT_FILTERING_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [CLIENT_RESOLVER_KEYS.FILTERING],
        id: CONFIGURATION_IDS.CLIENT_FILTERING,
    },
}

// BesuNodeManager configurations
export const BESU_NODE_MANAGER_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [BESU_NODE_MANAGER_RESOLVER_KEYS.BESU_NODE_MANAGER],
        id: CONFIGURATION_IDS.BESU_NODE_MANAGER,
    },
}

// Use case configurations
export const CLIENT_USE_CASE_CONFIGS = {
    FILTERING: createTokenConfig(
        CLIENT_FILTERING_CONFIGURATIONS.BASE,
        'client',
        'Client Filtering'
    ),
    BESU_NODE_MANAGER: createTokenConfig(
        BESU_NODE_MANAGER_CONFIGURATIONS.BASE,
        'client',
        'Besu Node Manager'
    ),
}

// Business logic definitions
export const CLIENT_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.CLIENT_FILTERING,
        key: CLIENT_RESOLVER_KEYS.FILTERING,
        contractName: CONTRACT_NAMES.CLIENT_FILTERING,
        artifactPath: ARTIFACT_PATHS.CLIENT_FILTERING,
    },
    {
        description: CONTRACT_NAMES.BESU_NODE_MANAGER,
        key: BESU_NODE_MANAGER_RESOLVER_KEYS.BESU_NODE_MANAGER,
        contractName: CONTRACT_NAMES.BESU_NODE_MANAGER,
        artifactPath: ARTIFACT_PATHS.BESU_NODE_MANAGER,
    },
]
