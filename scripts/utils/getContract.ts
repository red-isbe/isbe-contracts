import { type ContractRunner, Signer } from 'ethers'
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
        throw new Error('Invalid contract address format : ' + address)

    return factoryType.connect(address, signer)
}
