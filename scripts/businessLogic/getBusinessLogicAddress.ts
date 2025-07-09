import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'

export async function getBusinessLogicAddress(
    businessId: string,
    factory: string,
    version: string,
    signer: Signer
): Promise<{
    businessAddress: string
}> {
    const businessLogicFactory = await getIsbeFactory(factory, signer)

    const result = await businessLogicFactory.getBusinessLogicAddress(
        businessId,
        version
    )

    return {
        businessAddress: result,
    }
}
