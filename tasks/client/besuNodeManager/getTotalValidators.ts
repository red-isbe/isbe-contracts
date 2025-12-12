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
import { task, types } from 'hardhat/config'
import { getSigner } from '../../../scripts/utils/getSigner'
import { getTotalValidators } from '../../../scripts/client/besuNodeManager/getTotalValidators'

/**
 npx hardhat getTotalValidators --network dev \
  --besu-node-manager-address "0xCc979C27AeB74D13f73B2621b799b7221c1C9B4C" \
 --state 1
 */
task('getTotalValidators', 'Returns the number of validators registered')
    .addParam(
        'besuNodeManagerAddress',
        'The address of the proxy associated to besuNodeManagerFacet',
        undefined,
        types.string
    )
    .addParam('state', '1: ACTIVE, 2: STANDBY, 3: QUARANTINE', 1, types.int)
    .setAction(
        async (
            taskArgs: {
                besuNodeManagerAddress: string
                state: number
            },
            hre
        ) => {
            const { besuNodeManagerAddress, state } = taskArgs

            const signer = await getSigner(hre)

            const result = await getTotalValidators(
                besuNodeManagerAddress,
                state,
                signer
            )

            console.log(
                'Validators registered length: ',
                Number(result.validatorsLength)
            )
        }
    )
