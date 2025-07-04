/**
 * This script deploys new business logics.
 * In order to do it, it will invoke the "deploy(bytes32 businessId, bytes calldata bytecode)" method from the "IBusinessLogicFactory.sol" contract.
 * The script will get the following input parameters :
 *  - the "businessId" of the business logic to deploy.
 *  - the "bytecode" of the business logic to deploy.
 *  - the "factory" address of the "IBusinessLogicFactory" contract.
 * It will wait for the transaction to be mined then read the expected emitted event : event Deployed(bytes32 businessId,address businessAddress,uint256 version);
 * Finally it will return the business Id, address and version of the deployed business logic.
 */

// For ethers v6:
import { BigNumberish, Signer } from 'ethers'
import { getBusinessLogicFactory } from './utils/getBusinessLogicFactory'

export async function deployBusinessLogic(
    businessId: string,
    bytecode: string,
    factory: string,
    signer: Signer
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    let businessLogicFactory = await getBusinessLogicFactory(factory)
    businessLogicFactory = businessLogicFactory.connect(signer)

    const tx = await businessLogicFactory.deploy(businessId, bytecode)
    const receipt = await tx.wait()

    if (!receipt) {
        throw new Error('Transaction receipt is null')
    }

    // Parse logs to find the Deployed event
    let deployedEvent = null
    for (const log of receipt.logs) {
        try {
            const parsed = businessLogicFactory.interface.parseLog(log)
            if (parsed && parsed.name === 'Deployed') {
                deployedEvent = parsed
                break
            }
        } catch (e) {
            throw new Error(`Error parsing through logs : ${e}`)
        }
    }

    if (!deployedEvent) {
        throw new Error('Deployed event not found in transaction receipt')
    }

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}
