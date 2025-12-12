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
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BigNumberish } from 'ethers'
import { Secp256r1DeploymentUtils } from '../utils/Secp256r1DeploymentUtils'
import { ConfigurationManagementFacet__factory } from '../../typechain-types'
import { BusinessData } from './interfaces'

/**
 * secp256r1-compatible setConfig function using raw transactions
 * Bypasses ethers.js Contract class to avoid "Cannot find square root" error
 */
export async function setConfigSecp256r1(
    hre: HardhatRuntimeEnvironment,
    configId: string,
    businessIds: string[],
    versions: number[],
    factoryAddress: string
): Promise<{
    configurationId: string
    businessData: BusinessData[]
    version: BigNumberish
}> {
    if (businessIds.length !== versions.length) {
        throw Error('business Ids and versions length not the same')
    }

    const deploymentUtils = new Secp256r1DeploymentUtils(hre)

    // Prepare business data input
    const businessDataInput: BusinessData[] = []
    for (let i = 0; i < businessIds.length; i++) {
        businessDataInput.push({
            businessId: businessIds[i],
            version: versions[i],
        })
    }

    // Use factory-based deployment with proper event parsing
    const eventArgs = await deploymentUtils.deployContract(
        ConfigurationManagementFacet__factory,
        factoryAddress,
        'setConfiguration',
        [configId, businessDataInput],
        'ConfigurationSet',
        `🔧 Setting configuration with secp256r1 (ID: ${configId.slice(0, 10)}...)`
    )

    const { configurationId, businessData, version } = eventArgs

    console.log(`   ✅ Configuration set with version: ${version}`)

    return {
        configurationId,
        businessData,
        version: version.toString(),
    }
}
