/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
    disabled: boolean
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
    disabled: boolean
    clientFilteringAddress: string
    signer: Signer
}
