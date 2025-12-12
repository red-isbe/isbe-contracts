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
