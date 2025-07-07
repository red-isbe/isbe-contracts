import { Signer } from 'ethers'
import { getBusinessLogicFactory } from '../utils/getBusinessLogicFactory'

export async function getBusinessLogics(
    factory: string,
    signer: Signer
): Promise<{
    businessId: string[]
}> {
    const businessLogicFactory = await getBusinessLogicFactory(factory, signer)

    const result = await businessLogicFactory.getBusinessLogics()

    return {
        businessId: result,
    }
}
