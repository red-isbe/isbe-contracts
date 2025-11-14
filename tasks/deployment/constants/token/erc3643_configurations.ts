import { TokenConfiguration } from '../types'
import {
    ERC20_RESOLVER_KEYS,
    ERC20_ERC3643_SHARED_RESOLVER_KEYS,
    ERC3643_RESOLVER_KEYS,
} from '../resolverKeys'
import { CONFIGURATION_IDS } from '../configurationIds'
import { createTokenConfig, generateTokenConfiguration } from '../configHelpers'

/**
 * Helper function to create ERC3643 Security Token configuration
 *
 * ERC3643 extends ERC20 with regulatory compliance features.
 * The base seed uses ERC20 as foundation, then applies ERC3643 seed.
 *
 * @param keys - Array of resolver keys (will be sorted for determinism)
 * @returns TokenConfiguration with sorted keys and generated configuration ID
 */
function createERC3643Config(keys: string[]): TokenConfiguration {
    return generateTokenConfiguration(
        ERC20_RESOLVER_KEYS.ERC20, // Base key (ERC3643 extends ERC20)
        CONFIGURATION_IDS.ERC3643, // ERC3643 seed for configuration ID
        keys
    )
}

/**
 * ERC3643 Security Token Use Case Configurations
 *
 * ERC3643 is a complete standard for regulatory-compliant security tokens.
 * Unlike ERC20/ERC721, we provide a single comprehensive configuration
 * as security tokens require all compliance features to meet regulations.
 *
 * Configuration: SECURITY_TOKEN
 * - Includes all mandatory ERC20 base functionality
 * - Adds regulatory extensions (Snapshot, Capped, Controller)
 * - Includes full ERC3643 compliance stack
 */
export const ERC3643_USE_CASE_CONFIGS = {
    /**
     * SECURITY_TOKEN - Complete ERC3643 compliant security token
     *
     * Components:
     * 1. ERC20 Base: Standard token functionality
     * 2. ERC20 Extensions:
     *    - Snapshot: For dividends and voting
     *    - Capped: Regulated supply limit
     *    - Controller: Transfer control and forced transfers
     * 3. ERC3643 Core:
     *    - Metadata: onchainID and version tracking
     *    - Freeze: Address and partial token freezing
     *    - Recovery: Lost token recovery mechanism
     * 4. Compliance Engine:
     *    - Base Compliance: Transfer validation
     *    - Max Balance: Per-address balance limits
     *    - Daily/Monthly Limits: Temporal transfer restrictions
     *
     * Resolver keys are sorted lexicographically for deterministic
     * Configuration ID generation (ADR-003 Position-Based XOR algorithm)
     */
    SECURITY_TOKEN: createTokenConfig(
        createERC3643Config([
            // Base ERC20 (mandatory - automatically included as base key)
            ERC20_RESOLVER_KEYS.ERC20,

            // ERC20 Extensions for Security Tokens
            ERC20_RESOLVER_KEYS.SNAPSHOT, // Dividends & voting snapshots
            ERC20_ERC3643_SHARED_RESOLVER_KEYS.CAPPED, // Supply cap (regulatory)
            ERC20_ERC3643_SHARED_RESOLVER_KEYS.CONTROLLER, // Transfer control

            // ERC3643 Token Features
            ERC3643_RESOLVER_KEYS.METADATA, // onchainID + version
            ERC3643_RESOLVER_KEYS.FREEZE, // Address/token freezing
            ERC3643_RESOLVER_KEYS.RECOVERY, // Token recovery

            // ERC3643 Compliance Engine
            ERC3643_RESOLVER_KEYS.COMPLIANCE, // Base compliance
            ERC3643_RESOLVER_KEYS.COMPLIANCE_MAXBALANCE, // Balance limits
            ERC3643_RESOLVER_KEYS.COMPLIANCE_DMLIM, // Daily/monthly limits
        ]),
        'erc3643',
        'Security Token (ERC3643 Full Compliance)'
    ),
}

/**
 * Default export for convenience
 */
export const DEFAULT_ERC3643_CONFIG = ERC3643_USE_CASE_CONFIGS.SECURITY_TOKEN
