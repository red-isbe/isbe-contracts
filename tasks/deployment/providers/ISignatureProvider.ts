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
import { Signer, TransactionRequest, TransactionResponse } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

/**
 * Abstract interface for signature providers that handles different curves
 * (secp256k1, secp256r1) transparently
 */
export interface ISignatureProvider {
    /**
     * Get the signer for this provider
     */
    getSigner(): Promise<Signer>

    /**
     * Get the address of the signer
     */
    getAddress(): Promise<string>

    /**
     * Deploy a contract with the given bytecode and constructor args
     * Handles the complexity of raw transactions vs standard deployment
     */
    deployContract(
        contractName: string,
        bytecode: string,
        constructorArgs?: unknown[],
        constructorTypes?: string[]
    ): Promise<string>

    /**
     * Send a transaction (either standard or raw depending on provider)
     */
    sendTransaction(
        transaction: TransactionRequest
    ): Promise<TransactionResponse>

    /**
     * Wait for a transaction to be mined with proper polling
     */
    waitForTransaction(
        txHash: string,
        confirmations?: number,
        timeout?: number
    ): Promise<import('ethers').TransactionReceipt | null>

    /**
     * Get the curve type this provider uses
     */
    getCurveType(): 'secp256k1' | 'secp256r1'

    /**
     * Check if this provider supports the current network
     */
    isCompatibleWith(hre: HardhatRuntimeEnvironment): boolean
}
