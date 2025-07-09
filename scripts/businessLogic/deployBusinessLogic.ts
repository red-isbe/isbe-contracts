import { BigNumberish, Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytes, isValidBytesAndLength } from '../utils/validation'

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
    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    if (!isValidBytes(bytecode))
        throw new Error('Invalid byte code format : ' + bytecode)

    const businessLogicFactory = await getIsbeFactory(factory, signer)

    const tx = await businessLogicFactory.deploy(businessId, bytecode)

    const deployedEvent = await getEvent('Deployed', tx, businessLogicFactory)

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
