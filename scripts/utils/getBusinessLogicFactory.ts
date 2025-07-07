import { Signer } from 'ethers'
import { getContract } from './getContract'

export async function getBusinessLogicFactory(
    factoryAddress: string,
    signer: Signer
) {
    const { IBusinessLogicFactory__factory } = await import(
        '../../typechain-types'
    )

    return getContract(IBusinessLogicFactory__factory, factoryAddress, signer)
}
