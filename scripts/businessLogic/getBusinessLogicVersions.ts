import { Signer } from 'ethers'
import { getBusinessLogicFactory } from '../utils/getBusinessLogicFactory'

export async function getBusinessLogicVersions(
    businessId: string,
    factory: string,
    signer: Signer
): Promise<{
    businessIdVersions: string[]
}> {
    let businessLogicFactory = await getBusinessLogicFactory(factory)
    businessLogicFactory = businessLogicFactory.connect(signer)

    const result =
        await businessLogicFactory.getBusinessLogicVersions(businessId)

    return {
        businessIdVersions: result,
    }
}
