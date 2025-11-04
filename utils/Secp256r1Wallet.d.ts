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
