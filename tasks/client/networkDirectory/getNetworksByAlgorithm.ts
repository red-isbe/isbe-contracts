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
import { getNetworksByAlgorithm } from '../../../scripts/client/networkDirectory/getNetworksByAlgorithm'
import { Algorithm } from '../../../scripts/client/networkDirectory/createNetwork'

/**
 npx hardhat getNetworksByAlgorithm --network localhost \
  --algorithm 1 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getNetworksByAlgorithm', 'Gets networks filtered by algorithm')
    .addParam(
        'algorithm',
        'The algorithm type: 0=NONE, 1=SECP256K1, 2=SECP256R1',
        undefined,
        types.int
    )
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { algorithm, diamond } = taskArgs

        await getNetworksByAlgorithm(
            algorithm as Algorithm,
            diamond,
            hre.ethers.provider
        )
    })
