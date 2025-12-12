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
