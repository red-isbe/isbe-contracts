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
import { setTTL } from '../../scripts/ens/setTTL'

/**
 npx hardhat ensSetTTL --network localhost \
  --node "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --ttl 3600 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('ensSetTTL', 'Sets the TTL (time-to-live) of an ENS node')
    .addParam('node', 'The node hash to update', undefined, types.string)
    .addParam('ttl', 'The new TTL value in seconds', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { node, ttl, diamond } = taskArgs
        const signatureProvider = SignatureProviderFactory.create(hre)

        await setTTL(node, ttl, diamond, signatureProvider)
    })
