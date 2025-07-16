import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getBusinessLogicVersions(
    businessId: string,
    factory: string,
    signer: Signer
): Promise<{
    businessIdVersions: string[]
}> {
    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    const businessLogicFactory = await getIsbeFactory(factory, signer)

    const result =
        await businessLogicFactory.getBusinessLogicVersions(businessId)

    return {
        businessIdVersions: result,
    }
}
