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
import { randomBytes, createCipheriv } from 'crypto'
import { execSync, unlinkSync } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'

export interface EncryptionResult {
    data: string
    method: string
    vector: string
    key: string
    encryptedData: string
    iv: string // Added in hexadecimal format
    ciphertext: string // Added in hexadecimal format
}

export const encryptAES = (
    plain: string,
    validateWithOpenSSL: boolean = false
): EncryptionResult => {
    // Input validation
    if (typeof plain !== 'string') {
        throw new TypeError('Plaintext must be a string')
    }
    const key = randomBytes(32)
    const keyHex = key.toString('hex')
    const iv = randomBytes(16) // 16 bytes for AES-256-CBC
    const cipher = createCipheriv('aes-256-cbc', key, iv)

    let encrypted
    try {
        encrypted = Buffer.concat([
            cipher.update(plain, 'utf8'),
            cipher.final(),
        ])
    } catch (err) {
        throw new Error(
            'Encryption failed: ' +
                (err instanceof Error ? err.message : String(err))
        )
    }

    // Combined format: iv + encrypted data
    const combined = Buffer.concat([iv, encrypted])

    if (validateWithOpenSSL) {
        validateWithOpenSSL_CBC(plain, keyHex, iv, encrypted)
    }

    return {
        data: plain,
        method: 'aes-256-cbc',
        vector: iv.toString('base64'),
        key: keyHex,
        encryptedData: combined.toString('base64'),
        iv: iv.toString('hex'), // Added in hexadecimal format
        ciphertext: encrypted.toString('hex'), // Added in hexadecimal format
    }
}

function validateWithOpenSSL_CBC(
    plain: string,
    keyHex: string,
    iv: Buffer,
    encrypted: Buffer
): void {
    const encryptedPath = '/tmp/encrypted.bin'
    const decryptedPath = '/tmp/decrypted.txt'

    try {
        const ivHex = iv.toString('hex')

        // Write encrypted data
        writeFileSync(encryptedPath, encrypted)

        // OpenSSL command for AES-256-CBC
        const opensslCmd = `openssl enc -d -aes-256-cbc -in ${encryptedPath} -out ${decryptedPath} -K ${keyHex} -iv ${ivHex}`

        execSync(opensslCmd, {
            stdio: 'pipe',
            encoding: 'utf-8',
        })

        const decrypted = readFileSync(decryptedPath, 'utf-8')

        if (plain !== decrypted) {
            console.error('Expected:', plain)
            console.error('Got:', decrypted)
            throw new Error(
                'Decryption validation failed: decrypted data does not match the original'
            )
        }

        console.log(
            '✓ OpenSSL validation successful - decrypted data matches original'
        )
    } catch (err) {
        throw new Error(
            'OpenSSL validation failed: ' +
                (err instanceof Error ? err.message : String(err))
        )
    } finally {
        // Cleanup
        try {
            unlinkSync(encryptedPath)
        } catch (err) {
            console.debug(
                `Failed to delete encrypted file: ${err instanceof Error ? err.message : String(err)}`
            )
        }
        try {
            unlinkSync(decryptedPath)
        } catch (err) {
            console.debug(
                `Failed to delete decrypted file: ${err instanceof Error ? err.message : String(err)}`
            )
        }
    }
}

// Decryption function
export const decryptAES = (encryptedBase64: string, keyHex: string): string => {
    const key = Buffer.from(keyHex, 'hex')
    const combined = Buffer.from(encryptedBase64, 'base64')

    // Split the combined buffer: first 16 bytes = IV, rest = ciphertext
    const iv = combined.slice(0, 16)
    const encrypted = combined.slice(16)

    const decipher = createDecipheriv('aes-256-cbc', key, iv)

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ])

    return decrypted.toString('utf8')
}
