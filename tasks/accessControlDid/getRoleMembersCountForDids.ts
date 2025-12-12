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
 * @file getRoleMembersCountForDids.ts
 * @description Hardhat task to get the count of DIDs that have a specific role
 * @module tasks/accessControlDid
 */

/**
 npx hardhat getRoleMembersCountForDids --network localhost \
  --role 0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getRoleMembersCountForDids } from '../../scripts/accessControlDid/getRoleMembersCountForDids'

task(
    'getRoleMembersCountForDids',
    'Gets the count of DIDs that have a specific role'
)
    .addParam('role', 'The role identifier (bytes32)', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { role, diamond } = taskArgs
        return getRoleMembersCountForDids(role, diamond, hre.ethers.provider)
    })
