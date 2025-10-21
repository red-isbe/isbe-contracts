import {
    CONFIGURATION_IDS,
    ARTIFACT_PATHS,
    CONTRACT_NAMES,
} from './configurationIds'
import { createTokenConfig } from './configHelpers'
import { TSR_RESOLVER_KEYS } from './resolverKeys'

// TimeStampingRegistry configurations
export const TSR_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [TSR_RESOLVER_KEYS.TIMESTAMPING_REGISTRY],
        id: CONFIGURATION_IDS.TIMESTAMPING_REGISTRY,
    },
}

// Use case configurations
export const TSR_USE_CASE_CONFIGS = {
    TIMESTAMPING_REGISTRY: createTokenConfig(
        TSR_CONFIGURATIONS.BASE,
        'tsr',
        'TimeStamping Registry'
    ),
}

// Business logic definitions
export const TSR_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.TIMESTAMPING_REGISTRY,
        key: TSR_RESOLVER_KEYS.TIMESTAMPING_REGISTRY,
        contractName: CONTRACT_NAMES.TIMESTAMPING_REGISTRY,
        artifactPath: ARTIFACT_PATHS.TIMESTAMPING_REGISTRY,
    },
]
