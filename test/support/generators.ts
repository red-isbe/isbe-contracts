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
import hre from 'hardhat'
const { ethers } = hre

/**
 * Generic random data generators for testing
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
 * @returns A 20-byte hex string with '0x' prefix (checksummed)
 */
export function randomAddress(): string {
    return ethers.getAddress(randomHex(20))
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
