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

import { getConfig } from '../../scripts/configMgmt/getConfig'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getConfig --network localhost \
 --config-id "0x0000000000000000000000000000000000000000000000000000000000000001" \
 --config-version 1 \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getConfig', 'Returns full config')
    .addParam('configId', 'The configuration ID')
    .addParam('configVersion', 'The version number')
    .addParam('factory', 'The factory contract address')
    .setAction(
        async (
            taskArgs: {
                configId: string
                version: number
                factory: string
            },
            hre
        ) => {
            const { configId, version, factory } = taskArgs

            const signer = await getSigner(hre)

            const result = await getConfig(configId, version, factory, signer)

            console.log('Configuration:')

            for (let i = 0; i < result.businessData.length; i++) {
                console.log('Business Id:' + result.businessData[i].businessId)
                console.log('Version:' + result.businessData[i].version)
                console.log('')
            }
        }
    )
