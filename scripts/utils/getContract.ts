import { Signer, type ContractRunner } from 'ethers'

type Factory<T> = {
    connect: (address: string, signerOrProvider?: ContractRunner | null) => T
}

export async function getContract<T>(
    factoryType: Factory<T>,
    factoryAddress: string,
    signer: Signer
) {
    const factory = await factoryType.connect(factoryAddress, signer)

    return factory
}
