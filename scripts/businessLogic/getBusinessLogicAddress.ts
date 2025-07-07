import { Signer } from 'ethers'
import { getBusinessLogicFactory } from '../utils/getBusinessLogicFactory'

export async function getBusinessLogicAddress(
    businessId: string,
    factory: string,
    version: string,
    signer: Signer
): Promise<{
    businessAddress: string
}> {
    const businessLogicFactory = await getBusinessLogicFactory(factory, signer)

    const result = await businessLogicFactory.getBusinessLogicAddress(
        businessId,
        version
    )

    return {
        businessAddress: result,
    }
}
