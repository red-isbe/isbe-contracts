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
 * secp256k1 public key. Useful for inspecting DID documents that store
 * the verification method as a raw public key.
 * @module tasks/utils
 *
 * @example
 *   npx hardhat publicKeyToAddress \
 *     --publickey 0x0476f9eed75063e38c8db6d68588f2a77ea9ad5779c30cbc9b37945fa82ffdd91bf1f891f661c59b5ec61c3c4381f47f959b176d8c80d65d9958a62149adf83097
 *
 * Output:
 *   ═══════════════════════════════════════════════════════════
 *     Public Key → Ethereum Address (secp256k1)
 *   ═══════════════════════════════════════════════════════════
 *     Public Key: 0x0476f9...
 *     Address:    0x8a2C281b785988e5514CDfD7B1a2A92dB967F722
 *   ═══════════════════════════════════════════════════════════
 */

import { task } from 'hardhat/config'
import { computeAddress } from 'ethers'

task(
    'publicKeyToAddress',
    'Derives an Ethereum address from a secp256k1 public key (uncompressed 0x04..., raw X||Y, or compressed 0x02|0x03...)'
)
    .addParam(
        'publickey',
        'The secp256k1 public key as a hex string. Accepts uncompressed with marker (0x04 + 128 hex), raw X||Y (128 hex), or compressed (0x02|0x03 + 64 hex).'
    )
    .setAction(async (taskArgs) => {
        const { publickey } = taskArgs as { publickey: string }

        try {
            const key = publickey.startsWith('0x')
                ? publickey
                : `0x${publickey}`

            // Raw X||Y (128 hex chars, no SEC1 marker) — prepend 0x04 so
            // computeAddress gets a valid uncompressed key
            const canonical = /^0x[0-9a-fA-F]{128}$/.test(key)
                ? `0x04${key.slice(2)}`
                : key

            const address = computeAddress(canonical)

            console.log('')
            console.log(
                '═══════════════════════════════════════════════════════════'
            )
            console.log('  Public Key → Ethereum Address (secp256k1)')
            console.log(
                '═══════════════════════════════════════════════════════════'
            )
            console.log(`  Public Key: ${publickey}`)
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
