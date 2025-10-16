import { DID_RESOLVER_KEYS } from './resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from './configurationIds'

import { createTokenConfig } from './configHelpers'
import { CONFIGURATION_IDS } from './configurationIds'

// Generate DID configurations
export const DID_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [
            DID_RESOLVER_KEYS.DOCUMENT_DETAILED,
            DID_RESOLVER_KEYS.CONTROLLER,
            DID_RESOLVER_KEYS.VERIFICATION_METHOD,
            DID_RESOLVER_KEYS.VERIFICATION_RELATIONSHIP,
        ],
        id: CONFIGURATION_IDS.DID_REGISTRY,
    },
}

// Use case configurations
export const DID_USE_CASE_CONFIGS = {
    BASE: createTokenConfig(
        DID_CONFIGURATIONS.BASE,
        'did',
        'DID Registry Base'
    ),
}

// Business logic definitions
export const DID_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.DID_DOCUMENT_DETAILED,
        key: DID_RESOLVER_KEYS.DOCUMENT_DETAILED,
        contractName: CONTRACT_NAMES.DID_DOCUMENT_DETAILED,
        artifactPath: ARTIFACT_PATHS.DID_DOCUMENT_DETAILED,
    },
    {
        description: CONTRACT_NAMES.DID_CONTROLLER,
        key: DID_RESOLVER_KEYS.CONTROLLER,
        contractName: CONTRACT_NAMES.DID_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.DID_CONTROLLER,
    },
    {
        description: CONTRACT_NAMES.DID_VERIFICATION_METHOD,
        key: DID_RESOLVER_KEYS.VERIFICATION_METHOD,
        contractName: CONTRACT_NAMES.DID_VERIFICATION_METHOD,
        artifactPath: ARTIFACT_PATHS.DID_VERIFICATION_METHOD,
    },
    {
        description: CONTRACT_NAMES.DID_VERIFICATION_RELATIONSHIP,
        key: DID_RESOLVER_KEYS.VERIFICATION_RELATIONSHIP,
        contractName: CONTRACT_NAMES.DID_VERIFICATION_RELATIONSHIP,
        artifactPath: ARTIFACT_PATHS.DID_VERIFICATION_RELATIONSHIP,
    },
]
