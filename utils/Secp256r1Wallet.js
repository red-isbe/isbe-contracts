// SPDX-License-Identifier: MIT
/**
 * @title Secp256r1Wallet
 * @author ISBE Team
 * @notice Production-ready secp256r1 wallet implementation for Ethereum-compatible networks
 * @dev This wallet extends ethers.js AbstractSigner to provide secp256r1 signature capabilities
 *
 * Key Features:
 * - Full EIP-155 transaction signing with secp256r1
 * - Proper canonical signature generation
 * - Recovery parameter calculation
 * - Ethereum address derivation from secp256r1 public keys
 * - Compatible with Besu networks configured for secp256r1
 */

const { ethers } = require('ethers')
const EC = require('elliptic').ec

/**
 * @class Secp256r1Wallet
 * @extends ethers.AbstractSigner
 * @description Production secp256r1 wallet for Ethereum transactions
 */
class Secp256r1Wallet extends ethers.AbstractSigner {
    /**
     * @constructor
     * @param {string} privateKey - Secp256r1 private key (with or without 0x prefix)
     * @param {ethers.Provider} provider - Ethereum provider instance
     */
    constructor(privateKey, provider) {
        super(provider)

        // Initialize secp256r1 elliptic curve
        this.ec = new EC('p256')
        this.keyPair = this.ec.keyFromPrivate(
            privateKey.replace('0x', ''),
            'hex'
        )

        // Generate Ethereum address from secp256r1 public key
        this.address = this._deriveAddress()
    }

    /**
     * @private
     * @description Derives Ethereum address from secp256r1 public key
     * @returns {string} Ethereum address (checksummed)
     */
    _deriveAddress() {
        const publicKey = this.keyPair.getPublic()
        const publicKeyHex =
            '0x04' +
            publicKey.getX().toString('hex').padStart(64, '0') +
            publicKey.getY().toString('hex').padStart(64, '0')

        // Use uncompressed public key without 0x04 prefix for address derivation
        const publicKeyBytes = ethers.getBytes('0x' + publicKeyHex.slice(4))
        const addressHex = '0x' + ethers.keccak256(publicKeyBytes).slice(-40)

        return ethers.getAddress(addressHex)
    }

    /**
     * @description Gets the wallet address
     * @returns {Promise<string>} Ethereum address
     */
    async getAddress() {
        return this.address
    }

    /**
     * @description Signs a transaction using secp256r1
     * @param {ethers.TransactionRequest} transaction - Transaction to sign
     * @returns {Promise<string>} Signed transaction (serialized)
     */
    async signTransaction(transaction) {
        // Create unsigned transaction using ethers.js for proper serialization
        const unsignedTx = ethers.Transaction.from(transaction)
        const signingHash = unsignedTx.unsignedHash

        // Sign transaction hash with secp256r1
        const signature = this.keyPair.sign(ethers.getBytes(signingHash), {
            canonical: true,
        })

        // Find correct recovery parameter (0 or 1)
        const recoveryParam = this._findRecoveryParam(signingHash, signature)
        if (recoveryParam === null) {
            throw new Error('Could not determine recovery parameter')
        }

        // Generate canonical signature values
        const { r, s, actualRecoveryParam } = this._canonicalizeSignature(
            signature,
            recoveryParam
        )

        // Calculate EIP-155 v value
        const chainId = await this.provider.getNetwork().then((n) => n.chainId)
        const v = BigInt(chainId) * 2n + 35n + BigInt(actualRecoveryParam)

        // Apply signature to transaction
        unsignedTx.signature = {
            r: r,
            s: s,
            v: Number(v),
            networkV: Number(v),
            recoveryParam: actualRecoveryParam,
        }

        return unsignedTx.serialized
    }

    /**
     * @private
     * @description Finds the correct recovery parameter for signature
     * @param {string} signingHash - Transaction hash that was signed
     * @param {object} signature - Elliptic signature object
     * @returns {number|null} Recovery parameter (0 or 1) or null if not found
     */
    _findRecoveryParam(signingHash, signature) {
        for (let i = 0; i <= 1; i++) {
            try {
                const recovered = this.ec.recoverPubKey(
                    ethers.getBytes(signingHash),
                    signature,
                    i
                )
                const recoveredHex =
                    '0x04' +
                    recovered.getX().toString('hex').padStart(64, '0') +
                    recovered.getY().toString('hex').padStart(64, '0')

                const recoveredBytes = ethers.getBytes(
                    '0x' + recoveredHex.slice(4)
                )
                const recoveredAddr = ethers.getAddress(
                    '0x' + ethers.keccak256(recoveredBytes).slice(-40)
                )

                if (
                    recoveredAddr.toLowerCase() === this.address.toLowerCase()
                ) {
                    return i
                }
            } catch (e) {
                continue
            }
        }
        return null
    }

    /**
     * @private
     * @description Canonicalizes signature to ensure low s values
     * @param {object} signature - Elliptic signature object
     * @param {number} recoveryParam - Original recovery parameter
     * @returns {object} Canonical signature with r, s, and actualRecoveryParam
     */
    _canonicalizeSignature(signature, recoveryParam) {
        const SECP256R1_ORDER = BigInt(
            '0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'
        )
        const SECP256R1_HALF_ORDER = SECP256R1_ORDER / 2n

        const r = '0x' + signature.r.toString('hex').padStart(64, '0')
        let sValue = BigInt(
            '0x' + signature.s.toString('hex').padStart(64, '0')
        )
        let actualRecoveryParam = recoveryParam

        // Ensure canonical s value (must be <= half order)
        if (sValue > SECP256R1_HALF_ORDER) {
            sValue = SECP256R1_ORDER - sValue
            actualRecoveryParam = 1 - recoveryParam
        }

        const s = '0x' + sValue.toString(16).padStart(64, '0')

        return { r, s, actualRecoveryParam }
    }

    /**
     * @description Signs a message (not implemented for production security)
     * @throws {Error} Always throws - not implemented for security reasons
     */
    async signMessage(message) {
        throw new Error('signMessage not implemented for production security')
    }

    /**
     * @description Signs typed data (not implemented for production security)
     * @throws {Error} Always throws - not implemented for security reasons
     */
    async signTypedData(domain, types, value) {
        throw new Error('signTypedData not implemented for production security')
    }

    /**
     * @description Connects wallet to a new provider
     * @param {ethers.Provider} provider - New provider instance
     * @returns {Secp256r1Wallet} New wallet instance with the provider
     */
    connect(provider) {
        return new Secp256r1Wallet(this.keyPair.getPrivate('hex'), provider)
    }

    /**
     * @static
     * @description Creates contract transaction data for raw transaction calls
     * @param {ethers.Contract} contract - Contract interface
     * @param {string} functionName - Function to call
     * @param {Array} args - Function arguments
     * @returns {string} Encoded function data
     */
    static encodeContractCall(contract, functionName, args) {
        return contract.interface.encodeFunctionData(functionName, args)
    }

    /**
     * @static
     * @description Estimates gas for a transaction
     * @param {ethers.Provider} provider - Provider instance
     * @param {ethers.TransactionRequest} transaction - Transaction to estimate
     * @returns {Promise<bigint>} Gas estimate
     */
    static async estimateGas(provider, transaction) {
        return await provider.estimateGas(transaction)
    }
}

module.exports = { Secp256r1Wallet }
