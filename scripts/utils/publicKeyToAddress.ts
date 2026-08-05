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
 * secp256k1 public key using ethers.computeAddress.
 * Accepts the three common encodings:
 *   - Uncompressed with SEC1 marker:  0x04 || X(32) || Y(32)  (130 hex chars + 0x)
 *   - Raw uncompressed without marker:        X(32) || Y(32)  (128 hex chars)
 *   - Compressed:                     0x02|0x03 || X(32)      (66 hex chars + 0x)
 * @module scripts/utils
 */

import { computeAddress } from 'ethers'

/**
 * Converts a secp256k1 public key into its corresponding Ethereum address.
 *
 * @param publicKey The public key in any of the supported encodings.
 * @returns Checksummed Ethereum address.
 *
 * @example
 * publicKeyToAddress(
 *   '0x0476f9eed75063e38c8db6d68588f2a77ea9ad5779c30cbc9b37945fa82ffdd9' +
 *   '1bf1f891f661c59b5ec61c3c4381f47f959b176d8c80d65d9958a62149adf83097'
 * )
 * // → '0x8a2C281b785988e5514CDfD7B1a2A92dB967F722'
 */
export function publicKeyToAddress(publicKey: string): string {
    const key = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`

    // Raw X||Y (128 hex chars, no SEC1 marker) — prepend 0x04
    const canonical = /^0x[0-9a-fA-F]{128}$/.test(key)
        ? `0x04${key.slice(2)}`
        : key

    return computeAddress(canonical)
}

export default publicKeyToAddress
