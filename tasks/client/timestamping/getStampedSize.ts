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
import { task } from 'hardhat/config'
import { getStampedSize } from '../../../scripts/client/timestamping/getStampedSize'

/**
 npx hardhat getStampedSize --network localhost \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task(
    'getStampedSize',
    'Gets the total number of stamped entries in the TimeStampingRegistry'
)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { diamond } = taskArgs

        await getStampedSize(diamond, hre.ethers.provider)
    })
