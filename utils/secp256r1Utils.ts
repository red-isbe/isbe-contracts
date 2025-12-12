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
// utils/secp256r1Utils.ts
import { createHash } from 'crypto'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EC = require('elliptic').ec
// eslint-disable-next-line @typescript-eslint/no-require-imports
const keccak = require('keccak')

// Initialize secp256r1 (also known as P-256, prime256v1) curve
const ec = new EC('p256')

export interface Secp256r1KeyPair {
    privateKey: string // Hex string without 0x prefix
    publicKey: string // Uncompressed hex string (130 chars)
    compressedPublicKey: string // Compressed hex string (66 chars)
    address: string // Ethereum-style address derived from public key
}

/**
 * Generate a secp256r1 key pair with Ethereum-style address
 */
export function generateSecp256r1KeyPair(): Secp256r1KeyPair {
    const keyPair = ec.genKeyPair()

    const privateKey = keyPair.getPrivate('hex')
    const publicKeyPoint = keyPair.getPublic()

    // Get uncompressed public key (04 + x + y coordinates)
    const publicKey = publicKeyPoint.encode('hex', false) // false = uncompressed

    // Get compressed public key (02/03 + x coordinate)
    const compressedPublicKey = publicKeyPoint.encode('hex', true) // true = compressed

    // Calculate Ethereum-style address from uncompressed public key
    const address = deriveEthereumAddress(publicKey)

    return {
        privateKey,
        publicKey,
        compressedPublicKey,
        address,
    }
}

/**
 * Derive Ethereum-style address from secp256r1 public key
 * This follows the same pattern as Ethereum but using secp256r1 curve
 */
export function deriveEthereumAddress(publicKey: string): string {
    // Remove '04' prefix if present (uncompressed format indicator)
    const pubKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey

    // Ensure we have the full uncompressed public key (128 hex chars = 64 bytes)
    if (pubKey.length !== 128) {
        throw new Error(
            `Invalid public key length: ${pubKey.length}, expected 128`
        )
    }

    // Take Keccak-256 hash of the public key (x,y coordinates)
    const pubKeyBuffer = Buffer.from(pubKey, 'hex')
    const hash = createKeccakHash(pubKeyBuffer)

    // Take last 20 bytes (40 hex chars) and add 0x prefix
    return '0x' + hash.slice(-40)
}

/**
 * Proper Keccak-256 implementation for Ethereum-style address derivation
 */
function createKeccakHash(data: Buffer): string {
    return keccak('keccak256').update(data).digest('hex')
}

/**
 * Create secp256r1 key pair from private key hex string
 */
export function keyPairFromPrivateKey(privateKeyHex: string): Secp256r1KeyPair {
    // Remove 0x prefix if present
    const cleanPrivateKey = privateKeyHex.startsWith('0x')
        ? privateKeyHex.slice(2)
        : privateKeyHex

    const keyPair = ec.keyFromPrivate(cleanPrivateKey, 'hex')
    const publicKeyPoint = keyPair.getPublic()

    const publicKey = publicKeyPoint.encode('hex', false)
    const compressedPublicKey = publicKeyPoint.encode('hex', true)
    const address = deriveEthereumAddress(publicKey)

    return {
        privateKey: cleanPrivateKey,
        publicKey,
        compressedPublicKey,
        address,
    }
}

/**
 * Generate multiple secp256r1 accounts for testing
 */
export function generateSecp256r1Accounts(count: number): Secp256r1KeyPair[] {
    const accounts: Secp256r1KeyPair[] = []

    for (let i = 0; i < count; i++) {
        accounts.push(generateSecp256r1KeyPair())
    }

    return accounts
}

/**
 * Convert secp256r1 accounts to format compatible with Hardhat network config
 */
export function formatAccountsForHardhat(
    accounts: Secp256r1KeyPair[]
): string[] {
    return accounts.map((account) => '0x' + account.privateKey)
}

/**
 * Sign a message hash using secp256r1
 * Note: This is for demonstration. Full transaction signing would require more work.
 */
export function signMessageHash(
    messageHash: string,
    privateKey: string
): { r: string; s: string; v: number } {
    const keyPair = ec.keyFromPrivate(privateKey, 'hex')
    const msgHashBuffer = Buffer.from(
        messageHash.startsWith('0x') ? messageHash.slice(2) : messageHash,
        'hex'
    )

    const signature = keyPair.sign(msgHashBuffer)

    return {
        r: signature.r.toString('hex'),
        s: signature.s.toString('hex'),
        v: signature.recoveryParam || 0,
    }
}

/**
 * Verify signature using secp256r1
 */
export function verifySignature(
    messageHash: string,
    signature: { r: string; s: string },
    publicKey: string
): boolean {
    const keyPair = ec.keyFromPublic(publicKey, 'hex')
    const msgHashBuffer = Buffer.from(
        messageHash.startsWith('0x') ? messageHash.slice(2) : messageHash,
        'hex'
    )

    return keyPair.verify(msgHashBuffer, signature)
}

/**
 * Example usage and testing
 */
export function demonstrateSecp256r1Operations(): void {
    console.log('=== secp256r1 Operations Demo ===')

    // Generate a key pair
    const keyPair = generateSecp256r1KeyPair()
    console.log('Generated Key Pair:')
    console.log('  Private Key:', keyPair.privateKey)
    console.log('  Public Key:', keyPair.publicKey)
    console.log('  Compressed:', keyPair.compressedPublicKey)
    console.log('  Address:', keyPair.address)

    // Generate multiple accounts
    console.log('\n=== Generated Accounts ===')
    const accounts = generateSecp256r1Accounts(3)
    accounts.forEach((account, index) => {
        console.log(`Account ${index + 1}:`)
        console.log('  Address:', account.address)
        console.log('  Private Key:', account.privateKey)
    })

    // Sign and verify a message
    console.log('\n=== Signature Test ===')
    const messageHash = createHash('sha256')
        .update('Hello, secp256r1!')
        .digest('hex')
    const signature = signMessageHash(messageHash, keyPair.privateKey)
    const isValid = verifySignature(messageHash, signature, keyPair.publicKey)

    console.log('  Message Hash:', messageHash)
    console.log('  Signature R:', signature.r)
    console.log('  Signature S:', signature.s)
    console.log('  Signature Valid:', isValid)
}
