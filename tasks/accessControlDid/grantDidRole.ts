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
 * @file grantDidRole.ts
 * @description Hardhat task to grant a role to a DID
 * @module tasks/accessControlDid
 */

/**
 npx hardhat grantDidRole --network localhost \
  --role 0xaf2da20f2930ba6162489e7dc51c672f0482cbdc3b62d16063683f2d23f0a973 \
  --did 0x5d1bbbbb79e76850812569e44716059dab426a5d2f7378881192c73d372331de \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */

import { task, types } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { grantDidRole } from '../../scripts/accessControlDid/grantDidRole'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

task('grantDidRole', 'Grants a role to a DID (requires role admin)')
    .addParam('role', 'The role identifier (bytes32)', undefined, types.string)
    .addParam('did', 'The DID hash (bytes32)', undefined, types.string)
    .addParam('diamond', 'Diamond contract address', undefined, types.string)
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { role, did, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        return grantDidRole(role, did, diamond, signatureProvider)
    })
