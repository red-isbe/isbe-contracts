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
-------------------------------------------------------------- */
/**
 * @file getDidsByVerificationRelationship.ts
 * @description Hardhat task to list DIDs linked to a verification relationship
 * @module tasks/didVerificationRelationship
 */

/**
 npx hardhat getDidsByVerificationRelationship --network localhost \
  --vmethodid 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  --name "authentication" \
  --page 1 \
  --pagesize 10 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDidsByVerificationRelationship } from '../../scripts/didVerificationRelationship/getDidsByVerificationRelationship'

// Read: getDidsByVerificationRelationship(bytes32,string,uint256,uint256)
task(
    'getDidsByVerificationRelationship',
    'Gets paginated DIDs for a verification relationship'
)
    .addParam(
        'vmethodid',
        'Verification Method ID (bytes32)',
        undefined,
        types.string
    )
    .addParam('name', 'Relationship name', undefined, types.string)
    .addParam(
        'page',
        'Page number to retrieve (starting from 0)',
        0,
        types.int,
        true
    )
    .addParam('pagesize', 'Number of items per page', 10, types.int, true)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { vmethodid, name, page, pagesize, diamond } = taskArgs
        return getDidsByVerificationRelationship(
            vmethodid,
            name,
            page,
            pagesize,
            diamond,
            hre.ethers.provider
        )
    })
