// For ethers v6:
import { BigNumberish, Signer } from 'ethers'
import { getBusinessLogicFactory } from '../utils/getBusinessLogicFactory'

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
    const businessLogicFactory = await getBusinessLogicFactory(factory, signer)

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
