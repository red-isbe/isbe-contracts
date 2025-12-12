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
import { ethers } from 'ethers'

/**
 * Type declarations for Secp256r1Wallet
 * Implementation in utils/Secp256r1Wallet.js
 */

export class Secp256r1Wallet extends ethers.AbstractSigner {
    constructor(privateKey: string, provider?: ethers.Provider)

    getAddress(): Promise<string>
    signTransaction(transaction: ethers.TransactionRequest): Promise<string>
    signMessage(message: string | Uint8Array): Promise<string>
    signTypedData(
        domain: ethers.TypedDataDomain,
        types: Record<string, ethers.TypedDataField[]>,
        value: Record<string, unknown>
    ): Promise<string>
    connect(provider: ethers.Provider): Secp256r1Wallet
    call(
        transaction: ethers.TransactionRequest,
        blockTag?: string | number
    ): Promise<string>
}

export default Secp256r1Wallet
