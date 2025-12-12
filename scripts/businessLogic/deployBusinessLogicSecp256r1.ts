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
import { BigNumberish } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Secp256r1DeploymentUtils } from '../utils/Secp256r1DeploymentUtils'
import { BusinessLogicFactoryFacet__factory } from '../../typechain-types'

/**
 * secp256r1-compatible business logic deployment using raw transactions
 * Bypasses ethers.js Contract class to avoid "Cannot find square root" error
 */
export async function deployBusinessLogicSecp256r1(
    hre: HardhatRuntimeEnvironment,
    businessId: string,
    bytecode: string,
    factoryAddress: string
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    const deploymentUtils = new Secp256r1DeploymentUtils(hre)

    // Use factory-based deployment with proper event parsing
    const eventArgs = await deploymentUtils.deployContract(
        BusinessLogicFactoryFacet__factory,
        factoryAddress,
        'deploy',
        [businessId, bytecode],
        'Deployed',
        `🚀 Deploying business logic with secp256r1 (ID: ${businessId.slice(0, 10)}...)`
    )

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = eventArgs

    console.log(`   ✅ Business logic deployed at: ${businessAddress}`)

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}
