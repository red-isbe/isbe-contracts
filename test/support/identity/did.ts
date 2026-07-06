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
import { ethers } from 'hardhat'
import { randomBytes32, randomString, randomInt } from '../generators'

/**
 * DID-specific random data generators and proof utilities
 */

/**
 * Generate a random DID string
 * @returns A random DID identifier (bytes32)
 */
export function randomDid(): string {
    return randomBytes32()
}

/**
 * Derive a DID from a proof (65-byte signature)
 * DID = [1 version byte (0x00) | last 19 bytes of proof | 12 zero bytes]
 * (matches the encoding produced by did-isbe-registry)
 *
 * @param proof - The 65-byte serialized signature (0x-prefixed hex)
 * @returns bytes32 DID hex string
 */
export function proofToDid(proof: string): string {
    const proofClean = proof.startsWith('0x') ? proof.slice(2) : proof
    const payload = proofClean.slice(-38) // last 19 bytes = 38 hex chars
    const versionByte = '00' // did:isbe version byte
    const zeroSuffix = '0'.repeat(24) // 12 zero bytes = 24 hex chars
    return '0x' + versionByte + payload + zeroSuffix
}

/**
 * Generate proof from a wallet (sign keccak256 of public key)
 * proof = Signature.from(wallet.signingKey.sign(keccak256(publicKey65))).serialized
 *
 * @param wallet - Wallet with signingKey
 * @returns proof hex string (65 bytes, 0x-prefixed)
 */
export function generateProof(wallet: {
    signingKey: {
        publicKey: string
        sign: (digest: string) => ethers.SignatureLike
    }
}): string {
    const publicKey65 = wallet.signingKey.publicKey
    const message = ethers.keccak256(
        ethers.solidityPacked(['bytes'], [publicKey65])
    )
    const signature = wallet.signingKey.sign(message)
    return ethers.Signature.from(signature).serialized
}

/**
 * Generate a random verification method ID
 * @returns A random verification method identifier
 */
export function randomVerificationMethodId(): string {
    return randomString(12)
}

/**
 * Generate a random base document string
 * @returns A random base document string
 */
export function randomBaseDocument(): string {
    return randomString(20)
}

/**
 * Generate random timestamp pair (notBefore/notAfter)
 * @param duration Duration between timestamps in seconds (default: 1 year)
 * @returns Object with notBefore and notAfter bigint values
 */
export function randomTimestampPair(duration: bigint = 31536000n): {
    notBefore: bigint
    notAfter: bigint
} {
    const notBefore = (randomInt() % (BigInt(Date.now()) / 1000n)) + 1n
    const notAfter = notBefore + duration
    return { notBefore, notAfter }
}
