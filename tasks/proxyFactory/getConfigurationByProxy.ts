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

import { getConfigurationByProxy } from '../../scripts/proxyFactory/getConfigurationByProxy'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getConfigurationByProxy --network localhost \
  --proxy-address "0xF8698093eF2A86718040fabcaCaf8bf556911301" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getConfigurationByProxy', 'Returns full config')
    .addParam('proxyAddress', 'The address of the proxy')
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                proxyAddress: string
                factory: string
            },
            hre
        ) => {
            const { proxyAddress, factory } = taskArgs

            const signer = await getSigner(hre)

            const result = await getConfigurationByProxy(
                proxyAddress,
                factory,
                signer
            )

            console.log('Proxy Configuration:' + JSON.stringify(result))
        }
    )
