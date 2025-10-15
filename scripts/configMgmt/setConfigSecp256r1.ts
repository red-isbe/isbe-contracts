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
