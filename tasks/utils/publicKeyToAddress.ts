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
 * @description Hardhat task that derives an Ethereum address from a
 * secp256k1 public key. Supports three input formats:
 *   - Hex (uncompressed 0x04..., raw X||Y, or compressed 0x02|0x03...)
 *   - JWK JSON  { kty, crv, x, y }  (base64url coords, as found in DID documents)
 *   - JWK x/y params individually via --x and --y flags
 * @module tasks/utils
 *
 * @example Hex
   npx hardhat publicKeyToAddress --publickey 0x04a7a823e3bca818a36d04202e1bec80745aae4502831e49400b816c5f3efd0a2d4bde219bc8decb466fdf2c308a9c74b2aaee5404eef86a5b54fa8f4d6a8a8d54
 *
 * @example JWK JSON (e.g. from a DID document publicKeyJwk field)
 *   npx hardhat publicKeyToAddress \
 *     --jwk '{"kty":"EC","crv":"secp256k1","x":"phFoDzV0U3FUgkQStUSMYi9RQ87yx85x-KzGsD0Nqi8","y":"h91eMBfRwUY37dkpQt4EaWV50j8u2soO20KjzFUjuSE"}'
 *
 * @example JWK coords individually
    npx hardhat publicKeyToAddress \
 --x CbU2__xmY-A1DZE1qtyjFBK-dkhabVxtst83TM6WzBg \
 --y W6FLqBSba8hGUV0Do-rRdXVzCzDWlvBl-OjY7dlse0k
 */

import { task } from 'hardhat/config'
import { computeAddress } from 'ethers'

/** Decode a base64url string to a Buffer */
function b64urlToBuffer(s: string): Buffer {
    const padded =
        s.replace(/-/g, '+').replace(/_/g, '/') +
        '=='.slice((s.length + 3) % 4 || 4)
    return Buffer.from(padded, 'base64')
}

/** Build an uncompressed SEC1 hex key from JWK x/y base64url coords */
function jwkCoordsToHex(x: string, y: string): string {
    const xBuf = b64urlToBuffer(x)
    const yBuf = b64urlToBuffer(y)
    return '0x04' + xBuf.toString('hex') + yBuf.toString('hex')
}

task(
    'publicKeyToAddress',
    'Derives an Ethereum address from a secp256k1 public key (hex, JWK JSON, or JWK x/y coords)'
)
    .addOptionalParam(
        'publickey',
        'Hex public key: uncompressed (0x04 + 128 hex), raw X||Y (128 hex), or compressed (0x02|0x03 + 64 hex).'
    )
    .addOptionalParam(
        'jwk',
        'JWK JSON string with kty/crv/x/y fields (as found in DID document publicKeyJwk). Enclose in single quotes.'
    )
    .addOptionalParam(
        'x',
        'JWK x coordinate (base64url). Use together with --y.'
    )
    .addOptionalParam(
        'y',
        'JWK y coordinate (base64url). Use together with --x.'
    )
    .setAction(async (taskArgs) => {
        const { publickey, jwk, x, y } = taskArgs as {
            publickey?: string
            jwk?: string
            x?: string
            y?: string
        }

        try {
            let canonical: string
            let inputSummary: string

            if (jwk) {
                // --- JWK JSON ---
                const parsed = JSON.parse(jwk) as {
                    kty?: string
                    crv?: string
                    x?: string
                    y?: string
                }
                if (!parsed.x || !parsed.y)
                    throw new Error('JWK must contain x and y fields')
                if (parsed.crv && parsed.crv !== 'secp256k1') {
                    throw new Error(
                        `Unsupported curve: ${parsed.crv}. Only secp256k1 is supported.`
                    )
                }
                canonical = jwkCoordsToHex(parsed.x, parsed.y)
                inputSummary = `JWK  x: ${parsed.x}\n                 y: ${parsed.y}`
            } else if (x && y) {
                // --- JWK x/y params ---
                canonical = jwkCoordsToHex(x, y)
                inputSummary = `JWK  x: ${x}\n                 y: ${y}`
            } else if (publickey) {
                // --- Hex ---
                const key = publickey.startsWith('0x')
                    ? publickey
                    : `0x${publickey}`
                // Raw X||Y (128 hex chars, no SEC1 marker) — prepend 0x04
                canonical = /^0x[0-9a-fA-F]{128}$/.test(key)
                    ? `0x04${key.slice(2)}`
                    : key
                inputSummary = `Hex  ${publickey}`
            } else {
                throw new Error(
                    'Provide one of: --publickey <hex>, --jwk <json>, or --x <b64url> --y <b64url>'
                )
            }

            const address = computeAddress(canonical)

            console.log('')
            console.log(
                '═══════════════════════════════════════════════════════════'
            )
            console.log('  Public Key → Ethereum Address (secp256k1)')
            console.log(
                '═══════════════════════════════════════════════════════════'
            )
            console.log(`  Input:      ${inputSummary}`)
            console.log(`  Address:    ${address}`)
            console.log(
                '═══════════════════════════════════════════════════════════'
            )
            console.log('')

            return address
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            console.error(`❌ ${message}`)
            throw err
        }
    })
