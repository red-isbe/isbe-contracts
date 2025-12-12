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
