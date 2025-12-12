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
import { task } from 'hardhat/config'

import { getContractStorageSlots } from '../../scripts/extract/getContractStorageSlot'

/**
 npx hardhat StorageSlots --network localhost \
  --address "0x8796e5187fDAe37EFE827cd0a68cA73584011cE8" \
  --start "0x04fb5b1674918eac185959cfae932d99373bdf254d85286d6561bd7c87ae22e8" \
  --end "0x04fb5b1674918eac185959cfae932d99373bdf254d85286d6561bd7c87ae22eB"
 */

task('StorageSlots', 'Pauses a deployed smart contract')
    .addParam('address', 'The address of the contract to extract its code from')
    .addParam('start', 'The first storage slot to extract')
    .addParam('end', 'The last storage slot to extract')
    .setAction(async (taskArgs, hre) => {
        const { address, start, end } = taskArgs

        const slots = await getContractStorageSlots(address, start, end, hre)

        console.log('slots:', slots)
    })
