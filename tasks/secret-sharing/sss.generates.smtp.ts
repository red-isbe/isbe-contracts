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
import { int, string } from 'hardhat/internal/core/params/argumentTypes'
import { encryptAES } from '../../scripts/utils/aes'
import { CypherNotifier } from '../../scripts/utils/CypherNotifier'

/**
 npx hardhat sss.generate.smtp \
 --emails "directivo1@redisbe.es,directivo2@redisbe.es" \
 --phones "34777123098,34666123098" \
 --threshold 2 \
 --smtp-host "sandbox.smtp.mailtrap.io" \
 --smtp-port 2525 \
 --smtp-user "26021d7ed97f61" \
 --smtp-pass "9d2bac79238d34" \
 --vonage-api-key "vanageApiKey" \
 --vonage-api-secret "vanageApiSecret"
 */
task('sss.generate.smtp', 'Securely distribute SSS shares via email')
    .addParam(
        'emails',
        'Comma-separated recipient emails',
        undefined,
        string,
        true
    )
    .addParam(
        'phones',
        'Comma-separated recipient phone numbers (E.164 format)',
        undefined,
        string,
        true
    )
    .addParam(
        'threshold',
        'Minimum shares needed for reconstruction',
        2,
        int,
        true
    )
    .addParam('smtpHost', 'SMTP host', undefined, string, true)
    .addParam('smtpPort', 'SMTP port', 465, int, true)
    .addParam('smtpUser', 'SMTP username', undefined, string, true)
    .addParam('smtpPass', 'SMTP password', undefined, string, true)
    .addParam('vonageApiKey', 'Vonage API Key', undefined, string, true)
    .addParam('vonageApiSecret', 'Vonage API Secret', undefined, string, true)
    .setAction(async (taskArgs) => {
        const {
            emails: recipientEmails,
            phones: recipientPhones,
            threshold,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            vonageApiKey,
            vonageApiSecret,
        } = taskArgs
        // Fixed typo in variable name
        const emails = recipientEmails.split(',')
        const phones = recipientPhones.split(',')

        const numberOfShares = emails.length
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
            shares: numberOfShares,
            threshold: Number(threshold),
        })

        const cypherNotifier: CypherNotifier = new CypherNotifier(
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            vonageApiKey,
            vonageApiSecret
        )

        for (let i = 0; i < emails.length; i++) {
            const share = shares[i].toString('hex')
            const encryptedShare = encryptAES(share)
            await cypherNotifier.sendCypheredNotification(
                encryptedShare,
                emails[i],
                phones[i]
            )
        }

        // Prepare the result as a valid JSON object
        const result = {
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
