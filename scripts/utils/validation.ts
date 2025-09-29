import { ValidationError } from '../../utils/errors'

/**
 * Validates if a string is a valid hex bytes string
 * @param input - String to validate
 * @returns true if valid hex bytes, false otherwise
 */
export function isValidBytes(input: string): boolean {
    if (!/^0x[0-9a-fA-F]+$/.test(input)) {
        return false
    }

    const hexPart = input.slice(2)
    return hexPart.length % 2 === 0
}

/**
 * Validates if a string is valid hex bytes with specific length
 * @param input - String to validate
 * @param byteLength - Required length in bytes
 * @returns true if valid hex bytes with correct length, false otherwise
 */
export function isValidBytesAndLength(
    input: string,
    byteLength: number
): boolean {
    if (!isValidBytes(input)) {
        return false
    }

    // Check if length matches exactly the required byte length
    return input.length === 2 + byteLength * 2
}

/**
 * Validates if a string is a valid Ethereum address
 * @param address - Address to validate
 * @returns true if valid address, false otherwise
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/i.test(address)
}

/**
 * Validates if a string is a valid 32-byte hex string
 * @param input - String to validate
 * @returns true if valid 32-byte hex, false otherwise
 */
export function isValidBytes32(input: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(input)
}

/**
 * Validates if a string is a valid private key
 * @param key - Private key to validate
 * @returns true if valid private key, false otherwise
 */
export function isValidPrivateKey(key: string): boolean {
    const normalized = key.startsWith('0x') ? key : `0x${key}`
    return /^0x[a-fA-F0-9]{64}$/.test(normalized)
}

/**
 * Validates and throws error for business ID
 * @param businessId - Business ID to validate
 * @throws ValidationError if invalid
 */
export function validateBusinessId(businessId: string): void {
    if (!isValidBytesAndLength(businessId, 32)) {
        throw ValidationError.withSuggestions(
            'businessId',
            businessId,
            '32-byte hex string (0x + 64 hex characters)',
            [
                'Ensure the string starts with "0x"',
                'Ensure the string has exactly 64 hex characters after "0x"',
                'Use only valid hex characters (0-9, a-f, A-F)',
            ]
        )
    }
}

/**
 * Validates and throws error for bytecode
 * @param bytecode - Bytecode to validate
 * @throws ValidationError if invalid
 */
export function validateBytecode(bytecode: string): void {
    if (!isValidBytes(bytecode)) {
        throw ValidationError.withSuggestions(
            'bytecode',
            bytecode,
            'valid hex string starting with 0x',
            [
                'Ensure the string starts with "0x"',
                'Ensure the string contains only hex characters (0-9, a-f, A-F)',
                'Ensure the string has even number of characters after "0x"',
            ]
        )
    }

    if (bytecode.length < 4) {
        // At least "0x" + 1 byte
        throw new ValidationError(
            'bytecode',
            bytecode,
            'non-empty bytecode with at least 1 byte'
        )
    }
}

/**
 * Validates and throws error for Ethereum address
 * @param address - Address to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if invalid
 */
export function validateAddress(address: string, fieldName = 'address'): void {
    if (!isValidAddress(address)) {
        throw ValidationError.withSuggestions(
            fieldName,
            address,
            '40-character hex string prefixed with 0x',
            [
                'Ensure the address starts with "0x"',
                'Ensure the address has exactly 40 hex characters after "0x"',
                'Use only valid hex characters (0-9, a-f, A-F)',
            ]
        )
    }
}

/**
 * Validates and throws error for private key
 * @param privateKey - Private key to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if invalid
 */
export function validatePrivateKey(
    privateKey: string,
    fieldName = 'privateKey'
): void {
    if (!isValidPrivateKey(privateKey)) {
        throw ValidationError.withSuggestions(
            fieldName,
            privateKey,
            '64-character hex string (with or without 0x prefix)',
            [
                'Ensure the key has exactly 64 hex characters',
                'Use only valid hex characters (0-9, a-f, A-F)',
                'The "0x" prefix is optional',
            ]
        )
    }
}

/**
 * Validates and throws error for role hash
 * @param role - Role hash to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if invalid
 */
export function validateRole(role: string, fieldName = 'role'): void {
    if (!isValidBytes32(role)) {
        throw ValidationError.withSuggestions(
            fieldName,
            role,
            '32-byte hex string (0x + 64 hex characters)',
            [
                'Ensure the role starts with "0x"',
                'Ensure the role has exactly 64 hex characters after "0x"',
                'Use only valid hex characters (0-9, a-f, A-F)',
                'Consider using keccak256 hash of role name',
            ]
        )
    }
}

/**
 * Validates that a value is not null or undefined
 * @param value - Value to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if null or undefined
 */
export function validateRequired<T>(
    value: T | null | undefined,
    fieldName: string
): asserts value is T {
    if (value === null || value === undefined) {
        throw new ValidationError(fieldName, value, 'non-null value')
    }
}

/**
 * Validates that a string is not empty
 * @param value - String value to validate
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if empty
 */
export function validateNonEmpty(value: string, fieldName: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new ValidationError(fieldName, value, 'non-empty string')
    }
}

/**
 * Validates that a number is within a specific range
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Name of the field for error reporting
 * @throws ValidationError if out of range
 */
export function validateRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
): void {
    if (typeof value !== 'number' || value < min || value > max) {
        throw new ValidationError(
            fieldName,
            value,
            `number between ${min} and ${max} (inclusive)`
        )
    }
}
