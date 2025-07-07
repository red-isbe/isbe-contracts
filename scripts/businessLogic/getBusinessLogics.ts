import { Signer } from 'ethers'
import { getBusinessLogicFactory } from '../utils/getBusinessLogicFactory'

export async function getBusinessLogics(
    factory: string,
    signer: Signer
): Promise<{
    businessIdVersions: string[]
}> {
    let businessLogicFactory = await getBusinessLogicFactory(factory)
    businessLogicFactory = businessLogicFactory.connect(signer)

    const result = await businessLogicFactory.getBusinessLogics()

    return {
        businessIdVersions: result,
    }
}
