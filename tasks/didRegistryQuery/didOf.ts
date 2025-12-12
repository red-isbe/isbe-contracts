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
 * @file didOf.ts
 * @description Hardhat task to resolve the DID associated with an address
 * @module tasks/didRegistryQuery
 */

/**
 npx hardhat didOf --network localhost \
  --account 0x0000000000000000000000000000000000000000 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { didOf } from '../../scripts/didRegistryQuery/didOf'

// Read: didOf(address)
task('didOf', 'Resolves the DID associated with an address')
    .addParam('account', 'The address to resolve', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { account, diamond } = taskArgs
        return didOf(account, diamond, hre.ethers.provider)
    })
