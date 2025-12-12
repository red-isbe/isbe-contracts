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

import path from 'path'
import { deployBusinessLogic } from '../../scripts/businessLogic/deployBusinessLogic'
import fs from 'fs'
import { SignatureProviderFactory } from '../deployment/providers/SignatureProviderFactory'

/**
 npx hardhat deployBusinessLogic --network localhost \
  --business-id "0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a" \
  --factory "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6" \
  --bytecode-path "./artifacts/contracts/hashtimestamp/HashTimestampFacet.sol/HashTimestampFacet.json"
 */

task('deployBusinessLogic', 'Deploys business logic contract')
    .addParam('businessId', 'The business ID')
    .addParam('factory', 'The factory contract address')
    .addParam('bytecodePath', 'Path to the business logic bytecode')
    .setAction(async (taskArgs, hre) => {
        const { businessId, factory, bytecodePath } = taskArgs

        const signatureProvider = SignatureProviderFactory.create(hre)

        const bytecodeContent = fs
            .readFileSync(path.resolve(bytecodePath), 'utf8')
            .trim()

        const bytecode = JSON.parse(bytecodeContent).bytecode

        const result = await deployBusinessLogic(
            businessId,
            bytecode,
            factory,
            signatureProvider
        )

        console.log('Deployment result:', result)
    })
