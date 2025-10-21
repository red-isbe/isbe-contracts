import { ethers } from 'hardhat'

/**
 * Test utility functions for generating random test data
 */

/**
 * Generate a random hexadecimal string
 * @param length Length in bytes (default: 32)
 * @returns A hex string with '0x' prefix (lowercase)
 */
export function randomHex(length: number = 32): string {
    return ethers.hexlify(ethers.randomBytes(length)).toLowerCase()
}

/**
 * Generate a random string from hex bytes
 * @param length Length of the resulting string (default: 10)
 * @returns A hex string without '0x' prefix, truncated to specified length
 */
export function randomString(length: number = 10): string {
    const bytes = ethers.randomBytes(Math.ceil(length / 2))
    const hex = ethers.hexlify(bytes).slice(2) // Remove '0x'
    return hex.slice(0, length)
}

/**
 * Generate a random BigInt
 * @returns A random BigInt value
 */
export function randomInt(): bigint {
    const randomBytes = ethers.randomBytes(32)
    return ethers.toBigInt(ethers.hexlify(randomBytes))
}

/**
 * Generate a random bytes32 value (32 bytes hex string)
 * @returns A 32-byte hex string with '0x' prefix
 */
export function randomBytes32(): string {
    return randomHex(32)
}

/**
 * Generate a random address-like string
 * @returns A 20-byte hex string with '0x' prefix (lowercase)
 */
export function randomAddress(): string {
    return ethers.getAddress(randomHex(20))
}

/**
 * Test constants generator - creates randomized test data
 */
export class TestConstants {
    /**
     * Generate random pubkey coordinates for testing
     * @returns Object with x and y coordinates as 32-byte hex strings
     */
    static randomPubkeyPair() {
        return {
            x: randomBytes32(),
            y: randomBytes32(),
        }
    }

    /**
     * Generate a random ENS name
     * @returns A random domain name suitable for testing
     */
    static randomEnsName(): string {
        return `${randomString(8)}.eth`
    }

    /**
     * Generate random text key-value pair for ENS text records
     * @returns Object with key and value strings
     */
    static randomTextRecord() {
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
     * Generate random timestamp pair (notBefore/notAfter)
     * @param duration Duration between timestamps in seconds (default: 1 year)
     * @returns Object with notBefore and notAfter bigint values
     */
    static randomTimestampPair(duration: bigint = 31536000n): {
        notBefore: bigint
        notAfter: bigint
    } {
        const notBefore = (randomInt() % (BigInt(Date.now()) / 1000n)) + 1n
        const notAfter = notBefore + duration
        return { notBefore, notAfter }
    }

    /**
     * Generate a random DID string
     * @returns A random DID identifier
     */
    static randomDid(): string {
        return randomString(16)
    }

    /**
     * Generate a random verification method ID
     * @returns A random verification method identifier
     */
    static randomVerificationMethodId(): string {
        return randomString(12)
    }

    /**
     * Generate a random base document string
     * @returns A random base document string
     */
    static randomBaseDocument(): string {
        return randomString(20)
    }

    /**
     * Generate a random bytes32 value (32 bytes hex string)
     * @returns A 32-byte hex string with '0x' prefix
     */
    static randomBytes32(): string {
        return randomBytes32()
    }
}

/**
 * Common empty values for testing
 */
export const EMPTY_VALUES = {
    string: '',
    bytes: randomHex(0),
    hash: ethers.ZeroHash,
    address: ethers.ZeroAddress,
} as const
