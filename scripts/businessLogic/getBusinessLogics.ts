import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'

export async function getBusinessLogics(
    factory: string,
    signer: Signer
): Promise<{
    businessId: string[]
}> {
    const businessLogicFactory = await getIsbeFactory(factory, signer)

    const result = await businessLogicFactory.getBusinessLogics()

    return {
        businessId: result,
    }
}
