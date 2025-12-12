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
import { randomBytes32, randomString } from '../generators'

/**
 * ENS-specific random data generators
 */

/**
 * Generate a random ENS name
 * @returns A random domain name suitable for testing
 */
export function randomEnsName(): string {
    return `${randomString(8)}.eth`
}

/**
 * Generate random text key-value pair for ENS text records
 * @returns Object with key and value strings
 */
export function randomTextRecord(): { key: string; value: string } {
    const keys = [
        'email',
        'website',
        'avatar',
        'description',
        'twitter',
        'github',
    ]
    const key = keys[Math.floor(Math.random() * keys.length)]
    let value: string

    switch (key) {
        case 'email':
            value = `${randomString(6)}@${randomString(5)}.com`
            break
        case 'website':
            value = `https://${randomString(8)}.com`
            break
        case 'twitter':
            value = `@${randomString(6)}`
            break
        case 'github':
            value = `https://github.com/${randomString(8)}`
            break
        default:
            value = randomString(12)
    }

    return { key, value }
}

/**
 * Generate random pubkey coordinates for testing
 * @returns Object with x and y coordinates as 32-byte hex strings
 */
export function randomPubkeyPair(): { x: string; y: string } {
    return {
        x: randomBytes32(),
        y: randomBytes32(),
    }
}
