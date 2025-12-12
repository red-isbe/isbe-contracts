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
