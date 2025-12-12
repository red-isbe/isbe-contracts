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
 * @file getDids.ts
 * @description Hardhat task to retrieve a paginated list of registered DIDs
 * @module tasks/didDocument
 */

/**
 npx hardhat getDids --network localhost \
  --page 1 \
  --pagesize 10 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDids } from '../../scripts/didDocument/getDids'

task('getDids', 'Gets a paginated list of registered DIDs from the Diamond')
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
        const { page, pagesize, diamond } = taskArgs
        return getDids(page, pagesize, diamond, hre.ethers.provider)
    })
