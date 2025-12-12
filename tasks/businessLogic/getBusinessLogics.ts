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

import { getBusinessLogics } from '../../scripts/businessLogic/getBusinessLogics'
import { getSigner } from '../../scripts/utils/getSigner'

/**
 npx hardhat getBusinessLogics --network localhost \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
 */

task('getBusinessLogics', 'Deploys business logic contract')
    .addParam('factory', 'The factory contract address')
    .setAction(async (taskArgs, hre) => {
        const { factory } = taskArgs

        const signer = await getSigner(hre)

        const result = await getBusinessLogics(factory, signer)

        console.log('Business Logics:', result)
    })
