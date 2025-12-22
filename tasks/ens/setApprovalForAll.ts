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
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'
import { setApprovalForAll } from '../../scripts/ens/setApprovalForAll'

/**
 npx hardhat ensSetApprovalForAll --network localhost \
  --operator "0x1234567890123456789012345678901234567890" \
  --approved true \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'ensSetApprovalForAll',
    "Grants or revokes operator approval for all caller's ENS nodes"
)
    .addParam(
        'operator',
        'The address to grant or revoke permissions',
        undefined,
        types.string
    )
    .addParam(
        'approved',
        'True to grant, false to revoke',
        undefined,
        types.boolean
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { operator, approved, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setApprovalForAll(operator, approved, diamond, signatureProvider)
    })
