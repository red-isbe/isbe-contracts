import { Signer, type ContractRunner } from 'ethers'
import { isValidBytesAndLength } from './validation'

type Factory<T> = {
    connect: (address: string, signerOrProvider?: ContractRunner | null) => T
}

export async function getContract<T>(
    factoryType: Factory<T>,
    address: string,
    signer: Signer
) {
    if (!isValidBytesAndLength(address, 20))
        throw new Error('Invalid address format : ' + address)

    const factory = await factoryType.connect(address, signer)

    return factory
}
