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
import { WHITELIST_RESOLVER_KEYS } from '../resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from '../configurationIds'

/**
 * Whitelist extension (transversal - shared by ERC20, ERC721, ERC3643)
 * This is NOT a compliance module, but a transversal extension applicable to any token standard
 */
export const WHITELIST_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.BASIC_WHITELIST,
        key: WHITELIST_RESOLVER_KEYS.BASIC_WHITELIST,
        contractName: CONTRACT_NAMES.BASIC_WHITELIST,
        artifactPath: ARTIFACT_PATHS.BASIC_WHITELIST,
    },
]
