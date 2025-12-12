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
import { ERC721_RESOLVER_KEYS } from '../resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from '../configurationIds'

export const ERC721_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ERC721,
        key: ERC721_RESOLVER_KEYS.ERC721,
        contractName: CONTRACT_NAMES.ERC721,
        artifactPath: ARTIFACT_PATHS.ERC721,
    },
    {
        description: CONTRACT_NAMES.ERC721_BURNABLE,
        key: ERC721_RESOLVER_KEYS.BURNABLE,
        contractName: CONTRACT_NAMES.ERC721_BURNABLE,
        artifactPath: ARTIFACT_PATHS.ERC721_BURNABLE,
    },
    {
        description: CONTRACT_NAMES.ERC721_ENUMERABLE,
        key: ERC721_RESOLVER_KEYS.ENUMERABLE,
        contractName: CONTRACT_NAMES.ERC721_ENUMERABLE,
        artifactPath: ARTIFACT_PATHS.ERC721_ENUMERABLE,
    },
    {
        description: CONTRACT_NAMES.ERC721_CAPPED,
        key: ERC721_RESOLVER_KEYS.CAPPED,
        contractName: CONTRACT_NAMES.ERC721_CAPPED,
        artifactPath: ARTIFACT_PATHS.ERC721_CAPPED,
    },
    {
        description: CONTRACT_NAMES.ERC721_CONTROLLER,
        key: ERC721_RESOLVER_KEYS.CONTROLLER,
        contractName: CONTRACT_NAMES.ERC721_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.ERC721_CONTROLLER,
    },
    {
        description: CONTRACT_NAMES.ERC721_SNAPSHOT,
        key: ERC721_RESOLVER_KEYS.SNAPSHOT,
        contractName: CONTRACT_NAMES.ERC721_SNAPSHOT,
        artifactPath: ARTIFACT_PATHS.ERC721_SNAPSHOT,
    },
    {
        description: CONTRACT_NAMES.ERC721_ROYALTY,
        key: ERC721_RESOLVER_KEYS.ROYALTY,
        contractName: CONTRACT_NAMES.ERC721_ROYALTY,
        artifactPath: ARTIFACT_PATHS.ERC721_ROYALTY,
    },
    {
        description: CONTRACT_NAMES.ERC721_CONSECUTIVE,
        key: ERC721_RESOLVER_KEYS.CONSECUTIVE,
        contractName: CONTRACT_NAMES.ERC721_CONSECUTIVE,
        artifactPath: ARTIFACT_PATHS.ERC721_CONSECUTIVE,
    },
]
