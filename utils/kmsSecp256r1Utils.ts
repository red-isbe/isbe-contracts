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
// utils/kmsSecp256r1Utils.ts
//
// AWS KMS returns ECDSA_SHA_256 signatures and EC public keys as DER-encoded blobs
// (ASN.1), and never exposes a private key to derive a recovery id locally. This
// module bridges that gap for secp256r1/P-256 keys: DER decoding, the same
// Ethereum-style address derivation and low-S canonicalization already used by
// Secp256r1Wallet.js for local keys, and recovery-id brute force using only the
// public key (no private key needed, matching KMS's non-extractable-key model).
import { ethers } from 'ethers'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EC = require('elliptic').ec

const ec = new EC('p256')

// Order of the secp256r1/P-256 curve. Same constant as Secp256r1Wallet.js.
const SECP256R1_ORDER = BigInt(
    '0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'
)
const SECP256R1_HALF_ORDER = SECP256R1_ORDER / 2n

interface Tlv {
    tag: number
    content: Buffer
    nextOffset: number
}

/**
 * Minimal DER TLV (tag-length-value) reader, supporting short- and long-form
 * lengths. Sufficient for the fixed shapes AWS KMS returns for P-256 keys and
 * ECDSA_SHA_256 signatures — not a general-purpose ASN.1 parser.
 */
function readTlv(buf: Buffer, offset: number): Tlv {
    const tag = buf[offset]
    const lengthByte = buf[offset + 1]
    let length: number
    let contentOffset: number

    if ((lengthByte & 0x80) === 0) {
        length = lengthByte
        contentOffset = offset + 2
    } else {
        const numLengthBytes = lengthByte & 0x7f
        length = 0
        for (let i = 0; i < numLengthBytes; i++) {
            length = (length << 8) | buf[offset + 2 + i]
        }
        contentOffset = offset + 2 + numLengthBytes
    }

    return {
        tag,
        content: buf.subarray(contentOffset, contentOffset + length),
        nextOffset: contentOffset + length,
    }
}

function bytesToBigInt(bytes: Buffer): bigint {
    if (bytes.length === 0) {
        return 0n
    }
    return BigInt('0x' + bytes.toString('hex'))
}

/**
 * Decodes an AWS KMS `Sign` (SigningAlgorithm: ECDSA_SHA_256) response into
 * raw (r, s). KMS returns `SEQUENCE { INTEGER r, INTEGER s }`.
 */
export function decodeDerSignature(der: Uint8Array): { r: bigint; s: bigint } {
    const buf = Buffer.from(der)
    const sequence = readTlv(buf, 0)
    if (sequence.tag !== 0x30) {
        throw new Error(
            `Expected DER SEQUENCE (0x30) for ECDSA signature, got 0x${sequence.tag.toString(16)}`
        )
    }

    const rTlv = readTlv(sequence.content, 0)
    const sTlv = readTlv(sequence.content, rTlv.nextOffset)
    if (rTlv.tag !== 0x02 || sTlv.tag !== 0x02) {
        throw new Error(
            'Expected DER INTEGER (0x02) for signature r/s components'
        )
    }

    return {
        r: bytesToBigInt(rTlv.content),
        s: bytesToBigInt(sTlv.content),
    }
}

/**
 * Decodes an AWS KMS `GetPublicKey` response (DER SubjectPublicKeyInfo) into
 * the raw uncompressed EC point (0x04 || X || Y, 65 bytes).
 */
export function decodeDerPublicKeySpki(der: Uint8Array): Uint8Array {
    const buf = Buffer.from(der)
    const sequence = readTlv(buf, 0)
    if (sequence.tag !== 0x30) {
        throw new Error(
            `Expected DER SEQUENCE (0x30) for SubjectPublicKeyInfo, got 0x${sequence.tag.toString(16)}`
        )
    }

    // First child is the AlgorithmIdentifier SEQUENCE (OIDs for id-ecPublicKey +
    // prime256v1) — its content isn't needed, only where it ends.
    const algorithmIdentifier = readTlv(sequence.content, 0)
    const bitString = readTlv(sequence.content, algorithmIdentifier.nextOffset)
    if (bitString.tag !== 0x03) {
        throw new Error(
            `Expected DER BIT STRING (0x03) for public key point, got 0x${bitString.tag.toString(16)}`
        )
    }

    // A BIT STRING's content is prefixed by an "unused bits" count byte, which
    // is 0 for a byte-aligned EC point.
    const unusedBits = bitString.content[0]
    if (unusedBits !== 0) {
        throw new Error(
            `Unexpected unused-bits count in EC public key BIT STRING: ${unusedBits}`
        )
    }

    const point = bitString.content.subarray(1)
    if (point[0] !== 0x04) {
        throw new Error(
            'Expected an uncompressed EC point (0x04 prefix) in public key BIT STRING'
        )
    }

    return point
}

/**
 * Derives an Ethereum-style checksummed address from an uncompressed EC point
 * (0x04 || X || Y): keccak256(X || Y), last 20 bytes. Same scheme as
 * Secp256r1Wallet.js's _deriveAddress, extracted here so both the local wallet
 * and the KMS signer can share one implementation.
 */
export function deriveAddressFromUncompressedPoint(point: Uint8Array): string {
    if (point.length !== 65 || point[0] !== 0x04) {
        throw new Error(
            `Expected a 65-byte uncompressed EC point (0x04 || X || Y), got ${point.length} bytes`
        )
    }

    const xy = point.slice(1)
    const addressHex = '0x' + ethers.keccak256(xy).slice(-40)
    return ethers.getAddress(addressHex)
}

/**
 * Normalizes (r, s) to low-S form against the secp256r1 curve order, flipping
 * the recovery bit when s is negated. Same rule as Secp256r1Wallet.js's
 * _canonicalizeSignature, operating on bigints instead of BN objects so it
 * doesn't need a local elliptic keypair.
 */
export function canonicalizeSecp256r1Signature(
    r: bigint,
    s: bigint,
    recoveryParam: 0 | 1
): { r: string; s: string; recoveryParam: 0 | 1 } {
    let sValue = s
    let actualRecoveryParam = recoveryParam

    if (sValue > SECP256R1_HALF_ORDER) {
        sValue = SECP256R1_ORDER - sValue
        actualRecoveryParam = recoveryParam === 0 ? 1 : 0
    }

    return {
        r: '0x' + r.toString(16).padStart(64, '0'),
        s: '0x' + sValue.toString(16).padStart(64, '0'),
        recoveryParam: actualRecoveryParam,
    }
}

/**
 * Brute-forces the recovery id (0 or 1) by recovering the public key for each
 * candidate and comparing the address it derives to `expectedAddress`. Needs
 * only the signature, the signed hash and the expected address — no private
 * key — since AWS KMS never exposes one. Same approach as
 * Secp256r1Wallet.js's _findRecoveryParam.
 */
export function findRecoveryParam(
    messageHash: Uint8Array,
    r: bigint,
    s: bigint,
    expectedAddress: string
): 0 | 1 {
    const sigForRecovery = { r: r.toString(16), s: s.toString(16) }
    const msgBytes = Buffer.from(messageHash)

    for (const recoveryParam of [0, 1] as const) {
        try {
            const recovered = ec.recoverPubKey(
                msgBytes,
                sigForRecovery,
                recoveryParam
            )
            const x = recovered.getX().toString('hex').padStart(64, '0')
            const y = recovered.getY().toString('hex').padStart(64, '0')
            const point = Buffer.from('04' + x + y, 'hex')
            const address = deriveAddressFromUncompressedPoint(point)

            if (address.toLowerCase() === expectedAddress.toLowerCase()) {
                return recoveryParam
            }
        } catch {
            continue
        }
    }

    throw new Error(
        `Could not determine recovery parameter for address ${expectedAddress}`
    )
}
