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
import { getSigner } from '../../../scripts/utils/getSigner'
import { getRolesByAccount } from '../../../scripts/access/accessControl/getRolesByAccount'

/**
 npx hardhat getRolesByAccount --network localhost \
  --account "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
  --diamond "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getRolesByAccount', 'Grants a role to an account')
    .addParam('account', 'The account address')
    .addParam('diamond', 'The address of the contract')
    .setAction(async (taskArgs, hre) => {
        const { account, diamond } = taskArgs
        const signer = await getSigner(hre)
        const result = await getRolesByAccount(account, diamond, signer)
        console.log('Roles:' + result.roles)
    })
