export async function getBusinessLogicFactory(factoryAddress: string) {
    const { IBusinessLogicFactory__factory } = await import(
        '../../typechain-types'
    )
    return await IBusinessLogicFactory__factory.connect(factoryAddress)
}
