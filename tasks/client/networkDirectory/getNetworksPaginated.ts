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
import { getNetworksPaginated } from '../../../scripts/client/networkDirectory/getNetworksPaginated'

/**
 npx hardhat getNetworksPaginated --network localhost \
  --page-size 10 \
  --page-index 1 \
  --diamond "0xAF3c2371B900A23AEc9Edf3693D5b6240867eC10"
 */
task('getNetworksPaginated', 'Gets networks with pagination')
    .addParam('pageSize', 'Number of networks per page', undefined, types.int)
    .addParam('pageIndex', 'Page index (1-based)', undefined, types.int)
    .addParam('diamond', 'The address of the diamond contract')
    .setAction(async (taskArgs, hre) => {
        const { pageSize, pageIndex, diamond } = taskArgs

        await getNetworksPaginated(
            pageSize,
            pageIndex,
            diamond,
            hre.ethers.provider
        )
    })
