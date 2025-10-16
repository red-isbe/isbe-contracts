import {
    TransactionRequest,
    Signer,
    AddressLike,
    Provider,
    TransactionResponse,
} from 'ethers'

export interface ISignatureProvider {
    getSigner(): Promise<Signer>
    deployContract(bytecode: string, args: unknown[]): Promise<string>
    waitForTransaction(
        txHash: string,
        confirmations?: number
    ): Promise<{
        blockNumber: number
        blockHash: string
        transactionHash: string
    }>
    getCurveType(): string
    isCompatibleWith(curve: string): boolean

    signTransaction(transaction: TransactionRequest): Promise<string>
    sendTransaction(
        transaction: TransactionRequest
    ): Promise<TransactionResponse>
    call?(
        transaction: { to?: AddressLike; data?: string },
        blockTag?: string
    ): Promise<string>
    provider?: Provider
    address?: string
}
