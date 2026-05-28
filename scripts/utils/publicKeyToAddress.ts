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
-------------------------------------------------------------- */
/**
 * @file publicKeyToAddress.ts
 * @description Derives the Ethereum address that corresponds to a given
 * secp256k1 public key. Accepts the three common encodings:
 *   - Uncompressed with SEC1 marker:  0x04 || X(32) || Y(32)  (130 hex chars + 0x)
 *   - Raw uncompressed without marker:        X(32) || Y(32)  (128 hex chars)
 *   - Compressed:                     0x02|0x03 || X(32)      (66 hex chars + 0x)
 *
 * The Ethereum address is the rightmost 20 bytes of keccak256(X || Y).
 * @module scripts/utils
 */

import { computeAddress } from 'ethers'

/**
 * Normalises a hex string by lower-casing it and prefixing `0x` if missing.
 */
function normalise(input: string): string {
    const trimmed = input.trim().toLowerCase()
    return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
}

/**
 * Converts a secp256k1 public key into its corresponding Ethereum address.
 *
 * @param publicKey The public key in any of the supported encodings.
 * @returns Checksummed Ethereum address (e.g. "0x8a2C281b785988e5514CDfD7B1a2A92dB967F722").
 * @throws Error when the input is not a string, contains non-hex characters or
 * has an unexpected length.
 *
 * @example
 * publicKeyToAddress(
 *   '0x0476f9eed75063e38c8db6d68588f2a77ea9ad5779c30cbc9b37945fa82ffdd9' +
 *   '1bf1f891f661c59b5ec61c3c4381f47f959b176d8c80d65d9958a62149adf83097'
 * )
 * // → '0x8a2C281b785988e5514CDfD7B1a2A92dB967F722'
 */
export function publicKeyToAddress(publicKey: string): string {
    if (typeof publicKey !== 'string' || publicKey.length === 0) {
        throw new Error('Invalid public key: must be a non-empty string')
    }

    const normalised = normalise(publicKey)
    const body = normalised.slice(2)

    if (!/^[0-9a-f]+$/.test(body)) {
        throw new Error(
            `Invalid public key: contains non-hex characters (input="${publicKey}")`
        )
    }

    let canonical: string

    if (body.length === 130 && body.startsWith('04')) {
        // Already SEC1 uncompressed (0x04 || X || Y).
        canonical = normalised
    } else if (body.length === 128) {
        // Raw X || Y without the 0x04 marker — add it.
        canonical = `0x04${body}`
    } else if (
        body.length === 66 &&
        (body.startsWith('02') || body.startsWith('03'))
    ) {
        // SEC1 compressed (0x02|0x03 || X). ethers.computeAddress handles it.
        canonical = normalised
    } else {
        throw new Error(
            `Invalid public key length: ${body.length} hex chars after 0x. Expected one of:\n` +
                `  • 130 chars  →  0x04 || X || Y   (uncompressed, with SEC1 marker)\n` +
                `  • 128 chars  →  X || Y           (raw uncompressed, no marker)\n` +
                `  •  66 chars  →  0x02|0x03 || X   (compressed)`
        )
    }

    return computeAddress(canonical)
}

export default publicKeyToAddress
