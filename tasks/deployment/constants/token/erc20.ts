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
    ERC20_RESOLVER_KEYS,
    ERC20_ERC3643_SHARED_RESOLVER_KEYS,
} from '../resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from '../configurationIds'

export const ERC20_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ERC20,
        key: ERC20_RESOLVER_KEYS.ERC20,
        contractName: CONTRACT_NAMES.ERC20,
        artifactPath: ARTIFACT_PATHS.ERC20,
    },
    {
        description: CONTRACT_NAMES.ERC20_SNAPSHOT,
        key: ERC20_RESOLVER_KEYS.SNAPSHOT,
        contractName: CONTRACT_NAMES.ERC20_SNAPSHOT,
        artifactPath: ARTIFACT_PATHS.ERC20_SNAPSHOT,
    },
    {
        description: CONTRACT_NAMES.ERC20_BURNABLE,
        key: ERC20_RESOLVER_KEYS.BURNABLE,
        contractName: CONTRACT_NAMES.ERC20_BURNABLE,
        artifactPath: ARTIFACT_PATHS.ERC20_BURNABLE,
    },
    {
        description: CONTRACT_NAMES.ERC203643_CAPPED,
        key: ERC20_ERC3643_SHARED_RESOLVER_KEYS.CAPPED,
        contractName: CONTRACT_NAMES.ERC203643_CAPPED,
        artifactPath: ARTIFACT_PATHS.ERC203643_CAPPED,
    },
    {
        description: CONTRACT_NAMES.ERC203643_CONTROLLER,
        key: ERC20_ERC3643_SHARED_RESOLVER_KEYS.CONTROLLER,
        contractName: CONTRACT_NAMES.ERC203643_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.ERC203643_CONTROLLER,
    },
]
