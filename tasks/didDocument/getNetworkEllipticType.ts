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
 * Task: getNetworkEllipticType
 * Queries the network's configured elliptic type from the DiDRegistryInitialized event
 *
 * Usage:
 *   npx hardhat didDocument:getNetworkEllipticType --diamond <address>
 */
import { task } from 'hardhat/config'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getNetworkEllipticType } from '../../scripts/didDocument/getNetworkEllipticType'

task(
    'didDocument:getNetworkEllipticType',
    'Get the network elliptic type the DID Registry was initialized with'
)
    .addParam('diamond', 'Diamond contract address')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { diamond } = taskArgs
        return getNetworkEllipticType(diamond, hre.ethers.provider)
    })
