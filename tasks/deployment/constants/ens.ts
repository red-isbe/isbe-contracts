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
