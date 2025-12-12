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
import { task } from 'hardhat/config'
import sss from 'shamirs-secret-sharing'
import { ethers } from 'ethers'
import { generateSecp256r1KeyPair } from '../../utils/secp256r1Utils'

task(
    'sss.generate',
    "Generate private key and shares using Shamir's Secret Sharing obtaining secp256k1 and secp256r1 curves"
)
    .addParam('numberOfShares', 'Number of shares to generate')
    .addParam('threshold', 'Minimum number of shares needed to reconstruct')
    .setAction(async (taskArgs) => {
        const { numberOfShares, threshold } = taskArgs

        const secp256r1KeyPair = generateSecp256r1KeyPair()
        const privateKeyHex = `0x${secp256r1KeyPair.privateKey}`

        // Generate secp256k1 public key and address
        // Try multiple ways to get computePublicKey
        const publicKey = ethers.SigningKey.computePublicKey(
            privateKeyHex,
            true
        )

        // Generate address using computeAddress
        const address = ethers.computeAddress(privateKeyHex)

        // Create secret buffer from private key
        const secret = sss.Buffer.from(secp256r1KeyPair.privateKey, 'hex')

        // Split the secret using Shamir's Secret Sharing
        const shares = sss.split(secret, {
            shares: Number(numberOfShares),
            threshold: Number(threshold),
        })

        // Prepare the result as a valid JSON object
        const result = {
            shares: shares.map((share) => share.toString('hex')),
            secp256k1: {
                publicKey: publicKey,
                address: address,
            },
            secp256r1: {
                publicKey: '0x'.concat(secp256r1KeyPair.compressedPublicKey),
                address: secp256r1KeyPair.address,
            },
        }

        // Output as JSON
        console.log(JSON.stringify(result, null, 2))

        return result
    })
