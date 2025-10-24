import { randomBytes32, randomString, randomInt } from '../generators'

/**
 * DID-specific random data generators
 */

/**
 * Generate a random DID string
 * @returns A random DID identifier (bytes32)
 */
export function randomDid(): string {
    return randomBytes32()
}

/**
 * Generate a random verification method ID
 * @returns A random verification method identifier
 */
export function randomVerificationMethodId(): string {
    return randomString(12)
}

/**
 * Generate a random base document string
 * @returns A random base document string
 */
export function randomBaseDocument(): string {
    return randomString(20)
}

/**
 * Generate random timestamp pair (notBefore/notAfter)
 * @param duration Duration between timestamps in seconds (default: 1 year)
 * @returns Object with notBefore and notAfter bigint values
 */
export function randomTimestampPair(duration: bigint = 31536000n): {
    notBefore: bigint
    notAfter: bigint
} {
    const notBefore = (randomInt() % (BigInt(Date.now()) / 1000n)) + 1n
    const notAfter = notBefore + duration
    return { notBefore, notAfter }
}
