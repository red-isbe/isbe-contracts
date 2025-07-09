import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'

export async function getBusinessLogicVersions(
    businessId: string,
    factory: string,
    signer: Signer
): Promise<{
    businessIdVersions: string[]
}> {
    const businessLogicFactory = await getIsbeFactory(factory, signer)

    const result =
        await businessLogicFactory.getBusinessLogicVersions(businessId)

    return {
        businessIdVersions: result,
    }
}
