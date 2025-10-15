import { Signer } from 'ethers'

export enum FilterType {
    NONE,
    TRANSACTION_HASH,
    CONTRACT,
    SIGNATURE,
    CONTRACT_AND_SIGNATURE,
    JSONRPC_METHOD,
}

export interface RegisterFilterResult {
    filterId: string
    filterType: number
    transactionHash: string
    contractAddress: string
    signature: string
    jsonRpcMethod: string
    initialBlock: number
    endBlock: number
}

export interface RegisterFilterParams {
    filterId: string
    filterType: bigint
    transactionHash: string
    contractAddress: string
    signature: string
    jsonRpcMethod: string
    initialBlock: bigint
    endBlock: bigint
    clientFilteringAddress: string
    signer: Signer
}
