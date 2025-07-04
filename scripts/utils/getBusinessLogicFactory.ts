import {
    IBusinessLogicFactory__factory,
    IBusinessLogicFactory,
} from '../../typechain-types'

export async function getBusinessLogicFactory(
    factoryAddress: string
): Promise<IBusinessLogicFactory> {
    return await IBusinessLogicFactory__factory.connect(factoryAddress)
}
