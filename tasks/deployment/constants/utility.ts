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
import { BASE_RESOLVER_KEYS, UTILITY_RESOLVER_KEYS } from './resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from './configurationIds'

import { createTokenConfig } from './configHelpers'
import { CONFIGURATION_IDS } from './configurationIds'

// Hash Timestamp configurations
export const HASH_TIMESTAMP_CONFIGURATIONS = {
    BASE: {
        resolver_keys: [UTILITY_RESOLVER_KEYS.HASH_TIMESTAMP],
        id: CONFIGURATION_IDS.HASH_TIMESTAMP,
    },
}

// Use case configurations
export const UTILITY_USE_CASE_CONFIGS = {
    HASH_TIMESTAMP: createTokenConfig(
        HASH_TIMESTAMP_CONFIGURATIONS.BASE,
        'utility',
        'Hash Timestamp Service'
    ),
}

// Business logic definitions
export const UTILITY_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ISBE_CUT,
        key: BASE_RESOLVER_KEYS.ISBE_CUT,
        contractName: CONTRACT_NAMES.ISBE_CUT,
        artifactPath: ARTIFACT_PATHS.ISBE_CUT,
    },
    {
        description: CONTRACT_NAMES.ISBE_LOUPE,
        key: BASE_RESOLVER_KEYS.ISBE_LOUPE,
        contractName: CONTRACT_NAMES.ISBE_LOUPE,
        artifactPath: ARTIFACT_PATHS.ISBE_LOUPE,
    },
    {
        description: CONTRACT_NAMES.ACCESS_CONTROL,
        key: BASE_RESOLVER_KEYS.ACCESS_CONTROL,
        contractName: CONTRACT_NAMES.ACCESS_CONTROL,
        artifactPath: ARTIFACT_PATHS.ACCESS_CONTROL,
    },
    {
        description: CONTRACT_NAMES.ACCESS_CONTROL_DID,
        key: BASE_RESOLVER_KEYS.ACCESS_CONTROL_DID,
        contractName: CONTRACT_NAMES.ACCESS_CONTROL_DID,
        artifactPath: ARTIFACT_PATHS.ACCESS_CONTROL_DID,
    },
    {
        description: CONTRACT_NAMES.PAUSE,
        key: BASE_RESOLVER_KEYS.PAUSE,
        contractName: CONTRACT_NAMES.PAUSE,
        artifactPath: ARTIFACT_PATHS.PAUSE,
    },
    {
        description: CONTRACT_NAMES.HASH_TIMESTAMP,
        key: UTILITY_RESOLVER_KEYS.HASH_TIMESTAMP,
        contractName: CONTRACT_NAMES.HASH_TIMESTAMP,
        artifactPath: ARTIFACT_PATHS.HASH_TIMESTAMP,
    },
    {
        description: CONTRACT_NAMES.OWNABLE,
        key: UTILITY_RESOLVER_KEYS.OWNABLE,
        contractName: CONTRACT_NAMES.OWNABLE,
        artifactPath: ARTIFACT_PATHS.OWNABLE,
    },
]
