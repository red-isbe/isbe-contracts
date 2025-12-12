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
import { task, types } from 'hardhat/config'
import { isApprovedForAll } from '../../scripts/ens/isApprovedForAll'

/**
 npx hardhat ensIsApprovedForAll --network localhost \
  --owner "0x581fb771781AC39b5a6473ad9d423DaA841E1b21" \
  --operator "0x1234567890123456789012345678901234567890" \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensIsApprovedForAll',
    'Checks if an operator is approved for all nodes of an owner'
)
    .addParam(
        'owner',
        'The address that owns the domain nodes',
        undefined,
        types.string
    )
    .addParam(
        'operator',
        'The address to check for operator approval',
        undefined,
        types.string
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { owner, operator, diamond } = taskArgs

        await isApprovedForAll(owner, operator, diamond, hre.ethers.provider)
    })
