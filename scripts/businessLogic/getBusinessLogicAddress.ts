import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getBusinessLogicAddress(
    businessId: string,
    factory: string,
    version: string,
    signer: Signer
): Promise<{
    businessAddress: string
}> {
    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    const businessLogicFactory = await getIsbeFactory(factory, signer)

    const result = await businessLogicFactory.getBusinessLogicAddress(
        businessId,
        version
    )

    return {
        businessAddress: result,
    }
}
