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
import { ZeroHash } from 'ethers'

const CONSTANTS = {
    HEX_PREFIX: '0x',
    DEFAULT_POSITION_DIVISOR: 32n,
    TOTAL_BYTES: 32,
    BYTE_LENGTH: 2,
    HEX_PATTERN: /^0x[0-9a-fA-F]+$/,
}

/**
 * Build a configuration ID by combining a base ID with resolver keys.
 *
 * Uses the position-based XOR algorithm:
 * 1. Position = resolverKey % 32
 * 2. Extract byte at position
 * 3. Create mask with byte
 * 4. XOR masks together
 *
 * @param baseId The base configuration ID
 * @param resolverKeys Array of resolver keys
 * @returns Combined configuration ID
 */
export function buildConfigurationId(
    baseId: string,
    resolverKeys: string[]
): string {
    if (!baseId || !baseId.match(CONSTANTS.HEX_PATTERN)) {
        throw new Error('Base ID must be a valid hex string')
    }

    // Sort keys for consistent results
    const orderedKeys = [...resolverKeys].sort()

    try {
        // Convert base ID to BigInt
        const baseBigInt = baseId.startsWith(CONSTANTS.HEX_PREFIX)
            ? BigInt(baseId)
            : BigInt(CONSTANTS.HEX_PREFIX + baseId)

        // Process resolver keys
        const result = orderedKeys.reduce((acc, resolverKey) => {
            try {
                const keyBigInt = BigInt(resolverKey)
                const position = calculatePosition(keyBigInt)
                const maskValue = extractByteAtPosition(resolverKey, position)
                const mask = createMask(position, maskValue)

                return acc ^ mask
            } catch (error) {
                throw new Error(
                    `Failed to process resolver key ${resolverKey}: ${error.message}`
                )
            }
        }, baseBigInt)

        return formatResult(result)
    } catch (error) {
        console.error(`Failed to build configuration ID: ${error.message}`)
        return ZeroHash
    }
}

function calculatePosition(resolverKey: bigint): bigint {
    return resolverKey % CONSTANTS.DEFAULT_POSITION_DIVISOR
}

function extractByteAtPosition(resolverKey: string, position: bigint): string {
    const hexString = resolverKey.startsWith(CONSTANTS.HEX_PREFIX)
        ? resolverKey.slice(2)
        : resolverKey

    if (hexString.length !== 64) {
        throw new Error('Resolver key must be 32 bytes (64 hex characters)')
    }

    const positionNumber = Number(position)
    if (positionNumber < 0 || positionNumber >= CONSTANTS.TOTAL_BYTES) {
        throw new Error(`Position ${positionNumber} is out of range`)
    }

    const byteIndex =
        (CONSTANTS.TOTAL_BYTES - 1 - positionNumber) * CONSTANTS.BYTE_LENGTH
    return hexString.substring(byteIndex, byteIndex + CONSTANTS.BYTE_LENGTH)
}

function createMask(position: bigint, byteValue: string): bigint {
    if (!byteValue.match(/^[0-9a-fA-F]{2}$/)) {
        throw new Error('Byte value must be a 2-character hex string')
    }

    const pos = Number(position)
    if (pos < 0 || pos >= CONSTANTS.TOTAL_BYTES) {
        throw new Error(`Position ${pos} is out of range`)
    }

    const bytes = Array(CONSTANTS.TOTAL_BYTES).fill('00')
    const index = CONSTANTS.TOTAL_BYTES - 1 - pos
    bytes[index] = byteValue.toLowerCase()
    const hexString = CONSTANTS.HEX_PREFIX + bytes.join('')

    return BigInt(hexString)
}

function formatResult(result: bigint): string {
    const finalResult = result.toString(16).padStart(64, '0')
    return CONSTANTS.HEX_PREFIX + finalResult
}
