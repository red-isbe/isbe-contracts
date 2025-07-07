import { Signer } from 'ethers'

export async function getBusinessLogicFactory(
    factoryAddress: string,
    signer: Signer
) {
    const { IBusinessLogicFactory__factory } = await import(
        '../../typechain-types'
    )
    let businessLogicFactory =
        await IBusinessLogicFactory__factory.connect(factoryAddress)
    businessLogicFactory = businessLogicFactory.connect(signer)

    return businessLogicFactory
}
