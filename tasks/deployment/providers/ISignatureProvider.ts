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
