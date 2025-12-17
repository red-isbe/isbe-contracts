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
import nodemailer from 'nodemailer'
import { Vonage } from '@vonage/server-sdk'
import { EncryptionResult } from '@scripts/utils/aes'

export class CypherNotifier {
    private transporter: nodemailer.Transporter
    private vonage: Vonage

    constructor(
        smtpHost: string,
        smtpPort: number,
        smtpUser: string,
        smtpPass: string,
        vonageApiKey: string,
        vonageApiSecret: string
    ) {
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
        })

        this.vonage = new Vonage({
            apiKey: vonageApiKey,
            apiSecret: vonageApiSecret,
        })
    }

    async sendCypheredNotification(
        cyphered: EncryptionResult,
        recipient: string,
        phone: string
    ) {
        const emailBody = this.createEmailBody(cyphered)
        const smsBody = this.createSmsBody(cyphered)

        await this.sendEmail(recipient, emailBody)
        await this.sendSms(phone, smsBody)
    }

    private createEmailBody(cyphered: EncryptionResult): string {
        return `Dear User,

Here is your encrypted secret data.

To decrypt this message, you will need:
1. The encryption key (sent to you via SMS)
2. OpenSSL installed on your system

Decryption command:
# 1. Convert hex ciphertext to binary
echo "${cyphered.ciphertext}" | xxd -r -p > ciphertext.bin
# 2. Decrypt the message with OpenSSL (replace {{KEY_FROM_SMS}} with your key from SMS):
openssl enc -d -aes-256-cbc -in ciphertext.bin -out decrypted.txt -K {{KEY_FROM_SMS}} -iv ${cyphered.iv}

Instructions:
1. Save the base64-encoded encryptedData to a file (e.g., ciphertext.bin)
2. Use the key from your SMS message
3. Run the decryption command

Greetings,
ISBE Stuff
`
    }

    private createSmsBody(cyphered: EncryptionResult): string {
        return `Your decryption key: ${cyphered.key}
Replace it as it is indicated in the email.
Example decryption:
openssl enc -d -aes-256-cbc -in ciphertext.bin -out decrypted.txt -K ${cyphered.key} -iv {{IV_HEX}}`
    }

    private async sendEmail(recipient: string, body: string): Promise<void> {
        await this.transporter.sendMail({
            from: 'register@redisbe.com',
            to: recipient,
            subject: 'ISBE Secret Sharing Procedure',
            text: body,
        })
    }

    private async sendSms(phone: string, body: string): Promise<void> {
        await this.vonage.sms.send({
            from: 'ISBE',
            to: phone,
            text: body,
        })
    }
}
