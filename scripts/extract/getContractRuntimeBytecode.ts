import { isValidBytesAndLength } from '../utils/validation'

export async function getContractRuntimeBytecode(
    contractAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any
): Promise<string> {
    if (!isValidBytesAndLength(contractAddress, 20))
        throw new Error('Invalid contract address format : ' + contractAddress)

    const bytecode = await hre.ethers.provider.getCode(contractAddress)
    if (!bytecode || bytecode === '0x') {
        throw new Error(`No contract found at address: ${contractAddress}`)
    }
    return bytecode
}
