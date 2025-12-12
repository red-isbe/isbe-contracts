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
import { logger } from '../../utils/logger'
import { CONSTANTS, ConfigurationOptions } from './types'
import { ZeroHash } from 'ethers'

/**
 * Validates input parameters for configuration ID generation
 * @throws {Error} If inputs are invalid
 */
function validateInputs(seed: string, resolverKeys: string[]): void {
    if (!seed || typeof seed !== 'string') {
        throw new Error('Seed must be a non-empty string')
    }
    if (!seed.match(CONSTANTS.HEX_PATTERN)) {
        throw new Error('Seed must be a valid hexadecimal string')
    }
    if (!Array.isArray(resolverKeys)) {
        throw new Error('Resolver keys must be an array')
    }
    for (const key of resolverKeys) {
        if (!key.match(CONSTANTS.HEX_PATTERN)) {
            throw new Error(`Invalid hex format for resolver key: ${key}`)
        }
    }
}

/**
 * Logs initial configuration details when in verbose mode
 */
function logInitialConfiguration(seed: string, resolverKeys: string[]): void {
    logger.info('🔐 Building Configuration ID')
    logger.info('='.repeat(35))
    logger.info('')
    logger.config('Input Parameters:', {
        seed: seed,
        resolverKeysCount: resolverKeys.length,
    })
    logger.info('')
}

/**
 * Logs processing details for each resolver key when in verbose mode
 */
function logProcessingDetails(
    resolverKey: string,
    position: bigint,
    maskValue: string,
    mask: bigint
): void {
    logger.debug(
        'Reference:    0x3130292827262524232221201918171615141312111009080706050403020100'
    )
    logger.debug(`Resolver Key: ${resolverKey}`)
    logger.debug(`Position:     ${position}`)
    logger.debug(`Mask Value:   ${maskValue} (0x${maskValue})`)
    logger.debug(`Mask:         0x${mask.toString(16).padStart(64, '0')}`)
    logger.debug('')
}

/**
 * Formats the final result as a 32-byte hexadecimal string
 */
function formatResult(result: bigint): string {
    const finalResult = result.toString(16).padStart(64, '0')
    return CONSTANTS.HEX_PREFIX + finalResult
}

/**
 *  Build configuration ID using simple position and mask algorithm
 *
 *  This algorithm follows the test expectations:
 *  1. Position = BigInt(resolverKey) % 32n
 *  2. Mask value = BigInt(resolverKey) % 256n
 *  3. Mask = maskValue << (31 - position) * 8
 *  4. Result = seed & mask (AND operation for multiple keys)
 *
 * @param seed - The bytes32 string seed
 * @param resolverKeys - The resolver keys as bytes32 strings
 * @param options - Configuration options
 * @throws {Error} If inputs are invalid or processing fails
 * @return The bytes32 string configuration id (always 32 bytes)
 */
export function buildConfigurationId(
    seed: string,
    resolverKeys: string[],
    options: ConfigurationOptions = {}
): string {
    const {
        positionDivisor = CONSTANTS.DEFAULT_POSITION_DIVISOR,
        logLevel = CONSTANTS.DEFAULT_LOG_LEVEL,
    } = options

    if (positionDivisor <= 0) {
        throw new Error('Position divisor must be greater than 0')
    }

    // Validate inputs
    validateInputs(seed, resolverKeys)

    try {
        // Convert seed to BigInt
        const seedBigInt = seed.startsWith(CONSTANTS.HEX_PREFIX)
            ? BigInt(seed)
            : BigInt(CONSTANTS.HEX_PREFIX + seed)

        // Log initial configuration
        if (logLevel === 'verbose') {
            logInitialConfiguration(seed, resolverKeys)
        }

        // Sort resolver keys for deterministic results (required by ADR-003)
        const orderedKeys = [...resolverKeys].sort()

        // Process resolver keys
        const result = orderedKeys.reduce((acc, resolverKey) => {
            try {
                const keyBigInt = BigInt(resolverKey)
                const position = calculatePosition(
                    keyBigInt,
                    BigInt(positionDivisor)
                )
                const maskValue = extractByteAtPosition(resolverKey, position)
                const mask = createMask(position, maskValue)

                if (logLevel === 'verbose') {
                    logProcessingDetails(resolverKey, position, maskValue, mask)
                }

                return acc ^ mask
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)
                throw new Error(
                    `Failed to process resolver key ${resolverKey}: ${errorMessage}`
                )
            }
        }, seedBigInt)

        // Format and return result
        const hexResult = formatResult(result)

        if (logLevel === 'verbose') {
            logger.info('')
            logger.success('Configuration ID generated successfully')
            logger.config('Final Result:', {
                configurationId: hexResult,
                length: hexResult.length,
                resolverKeysProcessed: orderedKeys.length,
            })
            logger.info('')
        }

        return hexResult
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error)
        logger.error(`Failed to build configuration ID: ${errorMessage}`)
        throw error
    }

    return ZeroHash
}

/**
 * Calculates position from resolver key
 * @throws {Error} If calculation fails
 */
function calculatePosition(
    resolverKey: bigint,
    positionDivisor: bigint
): bigint {
    try {
        if (positionDivisor <= 0n) {
            throw new Error('Position divisor must be greater than 0')
        }
        return resolverKey % positionDivisor
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to calculate position: ${errorMessage}`)
    }
}

/**
 * Extracts a byte at the specified position from the resolver key
 * @throws {Error} If extraction fails or position is invalid
 */
function extractByteAtPosition(resolverKey: string, position: bigint): string {
    try {
        // Remove '0x' prefix if present
        const hexString = resolverKey.startsWith(CONSTANTS.HEX_PREFIX)
            ? resolverKey.slice(2)
            : resolverKey

        if (hexString.length !== 64) {
            throw new Error('Resolver key must be 32 bytes (64 hex characters)')
        }

        const positionNumber = Number(position)
        if (positionNumber < 0 || positionNumber >= CONSTANTS.TOTAL_BYTES) {
            throw new Error(
                `Position ${positionNumber} is out of range [0, ${CONSTANTS.TOTAL_BYTES - 1}]`
            )
        }

        // Each byte is 2 hex characters
        // Position 0 is the leftmost byte (most significant)
        const byteIndex =
            (CONSTANTS.TOTAL_BYTES - 1 - positionNumber) * CONSTANTS.BYTE_LENGTH
        return hexString.substring(byteIndex, byteIndex + CONSTANTS.BYTE_LENGTH)
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error)
        throw new Error(
            `Failed to extract byte at position ${position}: ${errorMessage}`
        )
    }
}

/**
 * Creates a mask for the given position and byte value
 * @throws {Error} If mask creation fails
 */
function createMask(position: bigint, byteValue: string): bigint {
    try {
        if (!byteValue.match(/^[0-9a-fA-F]{2}$/)) {
            throw new Error('Byte value must be a 2-character hex string')
        }

        const pos = Number(position)

        if (pos < 0 || pos >= CONSTANTS.TOTAL_BYTES) {
            throw new Error(
                `Position ${pos} is out of range [0, ${CONSTANTS.TOTAL_BYTES - 1}]`
            )
        }

        // Create the mask with proper byte positioning
        const bytes = Array(CONSTANTS.TOTAL_BYTES).fill('00')
        // Position 0 should map to least-significant byte (rightmost)
        const index = CONSTANTS.TOTAL_BYTES - 1 - pos
        bytes[index] = byteValue.toLowerCase()
        const hexString = CONSTANTS.HEX_PREFIX + bytes.join('')

        return BigInt(hexString)
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to create mask: ${errorMessage}`)
    }
}

export default buildConfigurationId
