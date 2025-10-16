/**
 * Types and constants for the configuration ID builder
 */

export type LogLevel = 'info' | 'verbose'

export interface ConfigurationOptions {
    /** The divisor used to calculate positions (default: 32) */
    positionDivisor?: number
    /** Log level for operation details */
    logLevel?: LogLevel
}

export const CONSTANTS = {
    /** Hexadecimal prefix */
    HEX_PREFIX: '0x',
    /** Number of characters in a byte when represented as hex */
    BYTE_LENGTH: 2,
    /** Total number of bytes in the configuration */
    TOTAL_BYTES: 32,
    /** Default position divisor */
    DEFAULT_POSITION_DIVISOR: 32,
    /** Default log level */
    DEFAULT_LOG_LEVEL: 'info' as LogLevel,
    /** Pattern for valid hexadecimal strings */
    HEX_PATTERN: /^(0x)?[0-9a-fA-F]+$/,
} as const
