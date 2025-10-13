import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { BigNumberish } from 'ethers'
import { Secp256r1DeploymentUtils } from '../utils/Secp256r1DeploymentUtils'
import { ProxyFactoryFacet__factory } from '../../typechain-types'
import { Rbac } from './interfaces'

/**
 * secp256r1-compatible deployUseCase function using raw transactions
 * Bypasses ethers.js Contract class to avoid "Cannot find square root" error
 */
// TODO: Use the signature provider version above
export async function deployUseCaseSecp256r1(
    hre: HardhatRuntimeEnvironment,
    configId: string,
    configVersion: number,
    roles: string[],
    members: string[][],
    initBusinessIds: string[],
    initData: string[],
    factoryAddress: string
): Promise<{
    configurationId: string
    version: BigNumberish
    rbacs: Rbac[]
    proxy: string
}> {
    // Validation
    if (initBusinessIds.length !== initData.length) {
        throw Error('initBusinessIds and initData length not the same')
    }

    if (roles.length !== members.length) {
        throw Error('roles and members length not the same')
    }

    const deploymentUtils = new Secp256r1DeploymentUtils(hre)

    // Prepare RBAC data
    const initRbacs: Rbac[] = []
    for (let i = 0; i < roles.length; i++) {
        initRbacs.push({
            role: roles[i],
            members: members[i],
        })
    }

    // Use factory-based deployment with proper event parsing
    const eventArgs = await deploymentUtils.deployContract(
        ProxyFactoryFacet__factory,
        factoryAddress,
        'deployUseCase',
        [
            configId,
            configVersion,
            initRbacs,
            false, // initPause
            initBusinessIds,
            initData,
        ],
        'UseCaseDeployed',
        `🚀 Deploying use case with secp256r1 (Config: ${configId.slice(0, 10)}...)`
    )

    const { configurationId, version, rbacs, proxy } = eventArgs

    console.log(`   ✅ Use case deployed at proxy: ${proxy}`)

    return {
        configurationId,
        version: version.toString(),
        rbacs,
        proxy,
    }
}
