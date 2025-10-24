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
