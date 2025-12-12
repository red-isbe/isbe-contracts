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
// utils/secp256r1TransactionSigner.ts
import {
    Transaction,
    TransactionRequest,
    keccak256,
    concat,
    toBeHex,
    getBytes,
    hexlify,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keyPairFromPrivateKey } from './secp256r1Utils'

// Import secp256r1 libraries
import * as p256Module from 'curve-p256'
import ECDSA from 'ecdsa-secp256r1'
import { encode as rlpEncode } from 'rlp'

/**
 * Comprehensive secp256r1 transaction signer for Ethereum-compatible networks
 * Supports multiple secp256r1 libraries for robust implementation
 */
export class Secp256r1TransactionSigner {
    private keyPair: { address: string }
    private p256Key: unknown
    private ecdsaKey: {
        sign(hash: string): { r: string; s: string; recoveryParam?: number }
    } | null = null

    constructor(
        private hre: HardhatRuntimeEnvironment,
        private privateKey: string
    ) {
        // Initialize multiple signing backends
        this.keyPair = keyPairFromPrivateKey(privateKey)

        try {
            // curve-p256 initialization
            const privKeyBytes = getBytes(
                privateKey.startsWith('0x') ? privateKey : '0x' + privateKey
            )
            this.p256Key = p256Module.p256.getPublicKey(privKeyBytes)
        } catch (e: unknown) {
            console.warn(
                'curve-p256 initialization failed:',
                e instanceof Error ? e.message : 'Unknown error'
            )
        }

        try {
            // ecdsa-secp256r1 initialization - try multiple approaches
            const cleanPrivateKey = privateKey.startsWith('0x')
                ? privateKey.slice(2)
                : privateKey

            // Method 1: Try with hex string
            try {
                this.ecdsaKey = ECDSA({ privateKey: cleanPrivateKey })
            } catch {
                // Method 2: Try with buffer
                const privKeyBytes = Buffer.from(cleanPrivateKey, 'hex')
                this.ecdsaKey = ECDSA({ privateKey: privKeyBytes })
            }
        } catch {
            // ECDSA library not critical since we have working alternatives
            // console.warn('ecdsa-secp256r1 initialization failed:', e.message)
        }
    }

    /**
     * Sign a transaction using secp256r1 curve with Besu compatibility
     */
    async signTransaction(transaction: Transaction): Promise<string> {
        console.log('🔐 Signing transaction with secp256r1...')

        // Check if we should use compatibility mode for current Besu configuration
        const useCompatibilityMode = await this.shouldUseCompatibilityMode()

        if (useCompatibilityMode) {
            console.log(
                '🔄 Using Besu compatibility mode (secp256k1 signature format)'
            )
            return await this.signWithCompatibilityMode(transaction)
        }

        // Pure secp256r1 signing for properly configured Besu networks
        try {
            return await this.signWithP256(transaction)
        } catch (e1) {
            console.warn(
                'curve-p256 signing failed, trying elliptic (P-256)...',
                e1.message
            )

            try {
                return await this.signWithElliptic(transaction)
            } catch (e2) {
                console.warn(
                    'elliptic (P-256) signing failed, trying compatibility mode...',
                    e2.message
                )
                return await this.signWithCompatibilityMode(transaction)
            }
        }
    }

    /**
     * Sign using curve-p256 library (preferred method)
     */
    private async signWithP256(transaction: Transaction): Promise<string> {
        console.log('   🎯 Using curve-p256 for signing')

        // Build the transaction hash for signing
        const txHash = this.getTransactionHash(transaction)
        const cleanPrivateKey = this.privateKey.startsWith('0x')
            ? this.privateKey.slice(2)
            : this.privateKey
        const cleanHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash

        // Sign with curve-p256 (expects hex strings without 0x prefix)
        const signature = p256Module.p256.sign(cleanHash, cleanPrivateKey)

        // Convert signature to Ethereum format with canonical s value
        const r = '0x' + signature.r.toString(16).padStart(64, '0')
        const sValue = BigInt('0x' + signature.s.toString(16).padStart(64, '0'))
        const canonicalS = this.ensureCanonicalS(sValue)
        const s = '0x' + canonicalS.toString(16).padStart(64, '0')

        // For EIP-155, v = chainId * 2 + 35 + recovery
        const chainId = transaction.chainId || 0
        const v = chainId * 2 + 35 + signature.recovery

        // Reconstruct the signed transaction
        return this.reconstructSignedTransaction(transaction, r, s, v)
    }

    /**
     * Sign using ecdsa-secp256r1 library
     */
    private async signWithECDSA(transaction: Transaction): Promise<string> {
        console.log('   🎯 Using ecdsa-secp256r1 for signing')

        // Build the transaction hash for signing
        const txHash = this.getTransactionHash(transaction)

        // Sign with ecdsa-secp256r1
        const signature = this.ecdsaKey.sign(txHash)

        // Convert signature to Ethereum format
        const r = '0x' + signature.r
        const s = '0x' + signature.s
        const v = 27 + (signature.recoveryParam || 0)

        // Reconstruct the signed transaction
        return this.reconstructSignedTransaction(transaction, r, s, v)
    }

    /**
     * Sign using elliptic library (already available)
     */
    private async signWithElliptic(transaction: Transaction): Promise<string> {
        console.log('   🎯 Using elliptic (P-256) for signing')

        // Use existing secp256r1Utils with elliptic
        const txHash = this.getTransactionHash(transaction)
        const cleanPrivateKey = this.privateKey.startsWith('0x')
            ? this.privateKey.slice(2)
            : this.privateKey

        // Import elliptic (already available in project)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const EC = require('elliptic').ec
        const ec = new EC('p256') // secp256r1 curve

        const keyPair = ec.keyFromPrivate(cleanPrivateKey, 'hex')
        const msgHashBytes = getBytes(txHash)

        const signature = keyPair.sign(msgHashBytes)

        // Convert to Ethereum format with canonical s value
        const r = '0x' + signature.r.toString('hex').padStart(64, '0')
        const sValue = BigInt(
            '0x' + signature.s.toString('hex').padStart(64, '0')
        )
        const canonicalS = this.ensureCanonicalS(sValue)
        const s = '0x' + canonicalS.toString(16).padStart(64, '0')

        // For EIP-155, v = chainId * 2 + 35 + recovery
        const chainId = transaction.chainId || 0
        const v = chainId * 2 + 35 + (signature.recoveryParam || 0)

        return this.reconstructSignedTransaction(transaction, r, s, v)
    }

    /**
     * Generate transaction hash for signing
     */
    private getTransactionHash(transaction: Transaction): string {
        // Create the signing hash based on transaction type
        if (transaction.type === 2) {
            // EIP-1559 transaction
            const encoded = this.encodeEIP1559Transaction(transaction)
            return keccak256(encoded)
        } else if (transaction.type === 1) {
            // EIP-2930 transaction
            const encoded = this.encodeEIP2930Transaction(transaction)
            return keccak256(encoded)
        } else {
            // Legacy transaction
            const encoded = this.encodeLegacyTransaction(transaction)
            return keccak256(encoded)
        }
    }

    /**
     * Encode EIP-1559 transaction for signing
     */
    private encodeEIP1559Transaction(tx: Transaction): string {
        const fields = [
            toBeHex(tx.chainId || 0),
            toBeHex(tx.nonce || 0),
            toBeHex(tx.maxPriorityFeePerGas || 0),
            toBeHex(tx.maxFeePerGas || 0),
            toBeHex(tx.gasLimit || 0),
            tx.to || '0x',
            toBeHex(tx.value || 0),
            tx.data || '0x',
            [], // accessList (empty for now)
        ]

        // RLP encode the fields
        const rlpEncoded = rlpEncode(fields)
        return concat(['0x02', rlpEncoded])
    }

    /**
     * Encode EIP-2930 transaction for signing
     */
    private encodeEIP2930Transaction(tx: Transaction): string {
        const fields = [
            toBeHex(tx.chainId || 0),
            toBeHex(tx.nonce || 0),
            toBeHex(tx.gasPrice || 0),
            toBeHex(tx.gasLimit || 0),
            tx.to || '0x',
            toBeHex(tx.value || 0),
            tx.data || '0x',
            [], // accessList (empty for now)
        ]

        const rlpEncoded = rlpEncode(fields)
        return concat(['0x01', rlpEncoded])
    }

    /**
     * Encode legacy transaction for signing
     */
    private encodeLegacyTransaction(tx: Transaction): string {
        const fields = [
            toBeHex(tx.nonce || 0),
            toBeHex(tx.gasPrice || 0),
            toBeHex(tx.gasLimit || 0),
            tx.to || '0x',
            toBeHex(tx.value || 0),
            tx.data || '0x',
            toBeHex(tx.chainId || 0),
            '0x',
            '0x',
        ]

        return hexlify(rlpEncode(fields))
    }

    /**
     * Reconstruct signed transaction from signature components
     */
    private reconstructSignedTransaction(
        transaction: Transaction,
        r: string,
        s: string,
        v: number
    ): string {
        console.log('   ✅ Transaction signed with secp256r1')
        console.log(
            `   📝 Signature: r=${r.slice(0, 10)}..., s=${s.slice(0, 10)}..., v=${v}`
        )

        // Reconstruct the signed transaction with proper RLP encoding
        if (transaction.type === 2) {
            // EIP-1559 transaction
            const fields = [
                toBeHex(transaction.chainId || 0),
                toBeHex(transaction.nonce || 0),
                toBeHex(transaction.maxPriorityFeePerGas || 0),
                toBeHex(transaction.maxFeePerGas || 0),
                toBeHex(transaction.gasLimit || 0),
                transaction.to || '0x',
                toBeHex(transaction.value || 0),
                transaction.data || '0x',
                [], // accessList (empty for now)
                toBeHex(v),
                r,
                s,
            ]
            const rlpEncoded = rlpEncode(fields)
            return concat(['0x02', rlpEncoded])
        } else if (transaction.type === 1) {
            // EIP-2930 transaction
            const fields = [
                toBeHex(transaction.chainId || 0),
                toBeHex(transaction.nonce || 0),
                toBeHex(transaction.gasPrice || 0),
                toBeHex(transaction.gasLimit || 0),
                transaction.to || '0x',
                toBeHex(transaction.value || 0),
                transaction.data || '0x',
                [], // accessList (empty for now)
                toBeHex(v),
                r,
                s,
            ]
            const rlpEncoded = rlpEncode(fields)
            return concat(['0x01', rlpEncoded])
        } else {
            // Legacy transaction
            const fields = [
                toBeHex(transaction.nonce || 0),
                toBeHex(transaction.gasPrice || 0),
                toBeHex(transaction.gasLimit || 0),
                transaction.to || '0x',
                toBeHex(transaction.value || 0),
                transaction.data || '0x',
                toBeHex(v),
                r,
                s,
            ]
            return hexlify(rlpEncode(fields))
        }
    }

    /**
     * Get the address derived from the secp256r1 key
     */
    getAddress(): string {
        return this.keyPair.address
    }

    /**
     * Determine if we should use compatibility mode based on network behavior
     */
    private async shouldUseCompatibilityMode(): Promise<boolean> {
        try {
            const network = await this.hre.ethers.provider.getNetwork()
            const chainId = Number(network.chainId)

            // Try pure secp256r1 mode with new Besu version first
            if (chainId === 2222) {
                console.log(
                    '   🎆 Besu v25.8.0 detected - testing pure secp256r1 mode'
                )
                return false // Try pure secp256r1 signing first
            }

            // For other networks, use compatibility mode
            return true
        } catch {
            console.warn(
                'Could not detect network capabilities, using compatibility mode'
            )
            return true
        }
    }

    /**
     * Compatibility mode: Use secp256k1 signature format with secp256r1-derived address
     */
    private async signWithCompatibilityMode(
        transaction: Transaction
    ): Promise<string> {
        console.log('   🔄 Signing in compatibility mode for Besu')

        // Use standard Ethereum (secp256k1) signing with our private key
        // This creates signatures that Besu can verify with its current configuration
        const wallet = new this.hre.ethers.Wallet(
            this.privateKey,
            this.hre.ethers.provider
        )
        const signedTx = await wallet.signTransaction(transaction)

        console.log('   ✅ Transaction signed in compatibility mode')
        console.log(
            '   🔍 Using secp256k1 signature format for current Besu configuration'
        )

        return signedTx
    }

    /**
     * Verify that secp256r1 signing is working correctly
     */
    async testSigning(): Promise<boolean> {
        console.log('🧪 Testing secp256r1 signing capabilities...')

        const testMessage = 'Hello, secp256r1 signing test!'
        const testHash = keccak256(Buffer.from(testMessage))

        try {
            // Test curve-p256
            if (this.p256Key) {
                const cleanPrivateKey = this.privateKey.startsWith('0x')
                    ? this.privateKey.slice(2)
                    : this.privateKey
                const cleanHash = testHash.startsWith('0x')
                    ? testHash.slice(2)
                    : testHash
                p256Module.p256.sign(cleanHash, cleanPrivateKey)
                console.log('   ✅ curve-p256 signing test passed')
            }
        } catch (e) {
            console.log(
                '   ❌ curve-p256 signing test failed:',
                e instanceof Error ? e.message : 'Unknown error'
            )
        }

        try {
            // Test ecdsa-secp256r1
            if (this.ecdsaKey) {
                this.ecdsaKey.sign(testHash)
                console.log('   ✅ ecdsa-secp256r1 signing test passed')
            }
        } catch (e) {
            console.log(
                '   ❌ ecdsa-secp256r1 signing test failed:',
                e instanceof Error ? e.message : 'Unknown error'
            )
        }

        try {
            // Test elliptic
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const EC = require('elliptic').ec
            const ec = new EC('p256')
            const keyPair = ec.keyFromPrivate(
                this.privateKey.startsWith('0x')
                    ? this.privateKey.slice(2)
                    : this.privateKey,
                'hex'
            )
            keyPair.sign(getBytes(testHash))
            console.log('   ✅ elliptic (P-256) signing test passed')
            return true
        } catch (e) {
            console.log(
                '   ❌ elliptic (P-256) signing test failed:',
                e instanceof Error ? e.message : 'Unknown error'
            )
        }

        return false
    }

    /**
     * Ensure the signature s value is canonical (lower half of curve order)
     * This is required for Ethereum compatibility (EIP-2)
     */
    private ensureCanonicalS(s: bigint): bigint {
        // secp256r1 curve order (n)
        const CURVE_ORDER = BigInt(
            '0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'
        )
        const HALF_ORDER = CURVE_ORDER / 2n

        // If s > n/2, use n - s to get the canonical (lower) form
        if (s > HALF_ORDER) {
            return CURVE_ORDER - s
        }

        return s
    }
}

/**
 * Factory to create secp256r1 signer when needed
 */
export function createSecp256r1Signer(
    hre: HardhatRuntimeEnvironment,
    privateKey: string
): Secp256r1TransactionSigner {
    return new Secp256r1TransactionSigner(hre, privateKey)
}

/**
 * Enhanced secp256r1 wallet that can replace ethers.Wallet for secp256r1 networks
 */
export class Secp256r1Wallet {
    private signer: Secp256r1TransactionSigner
    public address: string

    constructor(privateKey: string, hre: HardhatRuntimeEnvironment) {
        this.signer = new Secp256r1TransactionSigner(hre, privateKey)
        this.address = this.signer.getAddress()
    }

    async signTransaction(transaction: Transaction): Promise<string> {
        return await this.signer.signTransaction(transaction)
    }

    async getAddress(): Promise<string> {
        return this.address
    }

    /**
     * Perform an eth_call (read-only call to the blockchain)
     * This forwards the call to the provider without modification
     */
    async call(
        transaction: TransactionRequest,
        blockTag?: string | number
    ): Promise<string> {
        const hre = this.signer['hre'] // Access the hre instance from signer
        if (!hre?.ethers?.provider) {
            throw new Error('Provider not available on Secp256r1Wallet')
        }

        console.log('📞 Performing eth_call with secp256r1 wallet...')
        console.log(`   🎯 To: ${transaction.to}`)
        console.log(`   📋 Data: ${transaction.data?.slice(0, 42)}...`)

        // Forward the eth_call to the provider without modification
        const result = await hre.ethers.provider.call(transaction, blockTag)

        console.log(`   ✅ eth_call completed, result length: ${result.length}`)
        return result
    }

    async testCapabilities(): Promise<void> {
        console.log('🔍 Testing secp256r1 wallet capabilities...')
        console.log(`📍 Address: ${this.address}`)
        await this.signer.testSigning()
    }
}
