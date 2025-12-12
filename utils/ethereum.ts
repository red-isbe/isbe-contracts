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
import { ValidationError } from './errors'

/**
 * Normalizes a private key by adding 0x prefix if missing
 * @param key - Private key to normalize
 * @returns Normalized private key with 0x prefix
 */
export function normalizePrivateKey(key: string): string {
    if (typeof key !== 'string') {
        throw new ValidationError('privateKey', key, 'string value')
    }

    return key.startsWith('0x') ? key : `0x${key}`
}

/**
 * Validates if a string is a valid Ethereum private key
 * @param key - Private key to validate
 * @returns true if valid private key, false otherwise
 */
export function isValidPrivateKey(key: string): boolean {
    if (typeof key !== 'string') {
        return false
    }

    const normalized = normalizePrivateKey(key)
    return /^0x[a-fA-F0-9]{64}$/.test(normalized)
}

/**
 * Validates if a string is a valid Ethereum address
 * @param address - Address to validate
 * @returns true if valid address, false otherwise
 */
export function isValidAddress(address: string): boolean {
    if (typeof address !== 'string') {
        return false
    }

    return /^0x[a-fA-F0-9]{40}$/i.test(address)
}

/**
 * Validates if a string is a valid 32-byte hex string
 * @param input - String to validate
 * @returns true if valid 32-byte hex, false otherwise
 */
export function isValidBytes32(input: string): boolean {
    if (typeof input !== 'string') {
        return false
    }

    return /^0x[a-fA-F0-9]{64}$/.test(input)
}

/**
 * Validates and normalizes a private key with error throwing
 * @param key - Private key to validate and normalize
 * @returns Normalized private key
 * @throws ValidationError if invalid
 */
export function validateAndNormalizePrivateKey(key: string): string {
    if (typeof key !== 'string') {
        throw new ValidationError('privateKey', key, 'string value')
    }

    const normalized = normalizePrivateKey(key)

    if (!isValidPrivateKey(normalized)) {
        throw ValidationError.withSuggestions(
            'privateKey',
            key,
            '64-character hex string (with or without 0x prefix)',
            [
                'Ensure the key has exactly 64 hex characters',
                'Use only valid hex characters (0-9, a-f, A-F)',
                'The "0x" prefix is optional and will be added automatically',
            ]
        )
    }

    return normalized
}

/**
 * Validates an Ethereum address with error throwing
 * @param address - Address to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if invalid
 */
export function validateEthereumAddress(
    address: string,
    fieldName = 'address'
): void {
    if (typeof address !== 'string') {
        throw new ValidationError(fieldName, address, 'string value')
    }

    if (!isValidAddress(address)) {
        throw ValidationError.withSuggestions(
            fieldName,
            address,
            '40-character hex string prefixed with 0x',
            [
                'Ensure the address starts with "0x"',
                'Ensure the address has exactly 40 hex characters after "0x"',
                'Use only valid hex characters (0-9, a-f, A-F)',
                'Address format: 0x followed by 40 hex characters',
            ]
        )
    }
}

/**
 * Validates a bytes32 hex string with error throwing
 * @param input - String to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if invalid
 */
export function validateBytes32(input: string, fieldName = 'bytes32'): void {
    if (typeof input !== 'string') {
        throw new ValidationError(fieldName, input, 'string value')
    }

    if (!isValidBytes32(input)) {
        throw ValidationError.withSuggestions(
            fieldName,
            input,
            '32-byte hex string (0x + 64 hex characters)',
            [
                'Ensure the string starts with "0x"',
                'Ensure the string has exactly 64 hex characters after "0x"',
                'Use only valid hex characters (0-9, a-f, A-F)',
                'Consider using keccak256 for hashing if needed',
            ]
        )
    }
}

/**
 * Truncates an Ethereum address for display purposes
 * @param address - Full Ethereum address
 * @param startChars - Number of characters to show at start (default: 6, including 0x)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address like "0x1234...5678"
 */
export function truncateAddress(
    address: string,
    startChars = 6,
    endChars = 4
): string {
    validateEthereumAddress(address, 'address')

    if (address.length <= startChars + endChars) {
        return address
    }

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Checks if two Ethereum addresses are equal (case-insensitive)
 * @param address1 - First address
 * @param address2 - Second address
 * @returns true if addresses are equal
 */
export function addressesEqual(address1: string, address2: string): boolean {
    if (!isValidAddress(address1) || !isValidAddress(address2)) {
        return false
    }

    return address1.toLowerCase() === address2.toLowerCase()
}

/**
 * Converts wei to ether string representation
 * @param weiAmount - Amount in wei as string or bigint
 * @param decimals - Number of decimal places to show (default: 6)
 * @returns Formatted ether string
 */
export function weiToEther(weiAmount: string | bigint, decimals = 6): string {
    const wei = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount
    const etherValue = Number(wei) / 1e18
    return etherValue.toFixed(decimals)
}

/**
 * Converts ether to wei
 * @param etherAmount - Amount in ether as string or number
 * @returns Amount in wei as string
 */
export function etherToWei(etherAmount: string | number): string {
    const ether =
        typeof etherAmount === 'string' ? parseFloat(etherAmount) : etherAmount
    if (isNaN(ether)) {
        throw new ValidationError('etherAmount', etherAmount, 'valid number')
    }

    const wei = BigInt(Math.floor(ether * 1e18))
    return wei.toString()
}

/**
 * Common Ethereum constants
 */
export const ETHEREUM_CONSTANTS = {
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    ZERO_HASH:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    MAX_UINT256:
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',

    // Gas limits for common operations
    GAS_LIMITS: {
        TRANSFER: 21000,
        ERC20_TRANSFER: 65000,
        ERC721_TRANSFER: 85000,
        CONTRACT_DEPLOYMENT: 3000000,
    },

    // Common role hashes
    ROLES: {
        DEFAULT_ADMIN:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        MINTER_ROLE:
            '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
        PAUSER_ROLE:
            '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a',
        BURNER_ROLE:
            '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
    },
} as const

/**
 * Type guard to check if a value is a valid hex string
 * @param value - Value to check
 * @returns true if value is a hex string
 */
export function isHexString(value: unknown): value is string {
    return typeof value === 'string' && /^0x[a-fA-F0-9]*$/.test(value)
}

/**
 * Pads a hex string to a specific byte length
 * @param hex - Hex string to pad
 * @param byteLength - Target length in bytes
 * @returns Padded hex string
 */
export function padHex(hex: string, byteLength: number): string {
    if (!isHexString(hex)) {
        throw new ValidationError('hex', hex, 'valid hex string')
    }

    const targetLength = byteLength * 2 + 2 // 2 chars per byte + '0x'
    if (hex.length >= targetLength) {
        return hex
    }

    const padding = '0'.repeat(targetLength - hex.length)
    return hex.slice(0, 2) + padding + hex.slice(2)
}
