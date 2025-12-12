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
 * @file checkControllerByDid.ts
 * @description Hardhat task to check if an address is a controller for a DID (using bytes32)
 * @module tasks/didController
 */

/**
 npx hardhat checkControllerByDid --network localhost \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --controller "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { checkControllerByDid } from '../../scripts/didController/checkControllerByDid'

task(
    'checkControllerByDid',
    'Checks if an address is an authorized controller for the specified DID (bytes32 format)'
)
    .addParam('did', 'The DID identifier (bytes32)', undefined, types.string)
    .addParam(
        'controller',
        'The address to verify as a controller',
        undefined,
        types.string
    )
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { did, controller, diamond } = taskArgs
        return checkControllerByDid(
            did,
            controller,
            diamond,
            hre.ethers.provider
        )
    })
