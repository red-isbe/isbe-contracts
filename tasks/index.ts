/**
 * Unified Tasks Index
 *
 * This file provides a single entry point for all task-related functionality
 * in the ISBE contracts project. Import everything you need from here.
 *
 * @example Basic usage
 * ```typescript
 * import { DeploymentOrchestrator, DeploymentConfig, logger } from './tasks'
 *
 * // Get deployment configuration
 * const config = DeploymentConfig.getDefaultConfig()
 *
 * // Create orchestrator
 * const orchestrator = new DeploymentOrchestrator(hre, config)
 *
 * // Use debug-aware logging
 * logger.info('Starting deployment...')
 * ```
 *
 * @example Task execution
 * ```bash
 * # Run deployment tasks
 * npx hardhat deployAll --precommit
 * npx hardhat grantRole --role "0x..." --account "0x..." --diamond "0x..."
 * ```
 */

// Core deployment functionality
import { DeploymentOrchestrator } from './deployment/DeploymentOrchestrator'
import { CleanDeploymentOrchestrator } from './deployment/CleanDeploymentOrchestrator'
import { DeploymentConfig } from './deployment/config/DeploymentConfig'
import { DeploymentValidator } from './deployment/validators/DeploymentValidator'

// Deployment utilities and renderers
import { DeploymentTableRenderer } from './deployment/utils/DeploymentTableRenderer'
import { TableExporter } from './deployment/utils/TableExporter'
import { BytecodeExtractor } from './deployment/utils/BytecodeExtractor'

// Deployer classes
import { GovernanceDeployer } from './deployment/deployers/GovernanceDeployer'
import { BusinessLogicDeployer } from './deployment/deployers/BusinessLogicDeployer'
import { UseCaseDeployer } from './deployment/deployers/UseCaseDeployer'
import { CleanBusinessLogicDeployer } from './deployment/deployers/CleanBusinessLogicDeployer'
import { CleanGovernanceDeployer } from './deployment/deployers/CleanGovernanceDeployer'
import { CleanUseCaseDeployer } from './deployment/deployers/CleanUseCaseDeployer'

// Signature providers
import { ISignatureProvider } from './deployment/providers/ISignatureProvider'
import { SignatureProviderFactory } from './deployment/providers/SignatureProviderFactory'
import { Secp256k1SignatureProvider } from './deployment/providers/Secp256k1SignatureProvider'
import { Secp256r1SignatureProvider } from './deployment/providers/Secp256r1SignatureProvider'

// Validation utilities
import {
    PreCommitValidator,
    type ValidationResult,
} from './validation/PreCommitValidator'

// Constants and types
import {
    BUSINESS_LOGIC_DEFINITIONS,
    DEFAULT_USE_CASE_CONFIGURATIONS,
    DEFAULT_GOVERNANCE_CONFIG,
} from './deployment/constants/DeploymentConstants'

import {
    type DeploymentResult,
    type DeploymentOptions,
    type BusinessLogicConfig,
    type UseCaseConfig,
    type GovernanceConfig,
    type ValidationConstants,
    type DeployedBusinessLogic,
    type DeployedUseCase,
    type DeployedGovernance,
} from './deployment/types/DeploymentTypes'

// Import logger from config
import { logger, isDebug, suppressLogging } from '../config'

// Import Hardhat types
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

// Re-export all core modules
export {
    // Core deployment classes
    DeploymentOrchestrator,
    CleanDeploymentOrchestrator,
    DeploymentConfig,
    DeploymentValidator,

    // Utilities
    DeploymentTableRenderer,
    TableExporter,
    BytecodeExtractor,

    // Deployers
    GovernanceDeployer,
    BusinessLogicDeployer,
    UseCaseDeployer,
    CleanBusinessLogicDeployer,
    CleanGovernanceDeployer,
    CleanUseCaseDeployer,

    // Signature providers
    ISignatureProvider,
    SignatureProviderFactory,
    Secp256k1SignatureProvider,
    Secp256r1SignatureProvider,

    // Validation
    PreCommitValidator,
    type ValidationResult,

    // Constants and configurations
    BUSINESS_LOGIC_DEFINITIONS,
    DEFAULT_USE_CASE_CONFIGURATIONS,
    DEFAULT_GOVERNANCE_CONFIG,

    // Logger
    logger,
    isDebug,
    suppressLogging,
}

// Export all types
export type {
    DeploymentResult,
    DeploymentOptions,
    BusinessLogicConfig,
    UseCaseConfig,
    GovernanceConfig,
    ValidationConstants,
    DeployedBusinessLogic,
    DeployedUseCase,
    DeployedGovernance,
}

/**
 * Quick access to commonly used task functionality
 */
export const tasks = {
    /**
     * Create a deployment orchestrator with default configuration
     */
    createOrchestrator: (
        hre: HardhatRuntimeEnvironment,
        config?: DeploymentConfig
    ) => {
        const deploymentConfig = config || DeploymentConfig.getDefaultConfig()
        return new DeploymentOrchestrator(hre, deploymentConfig)
    },

    /**
     * Create a clean deployment orchestrator
     */
    createCleanOrchestrator: (
        hre: HardhatRuntimeEnvironment,
        config?: DeploymentConfig
    ) => {
        const deploymentConfig = config || DeploymentConfig.getDefaultConfig()
        return new CleanDeploymentOrchestrator(hre, deploymentConfig)
    },

    /**
     * Get default deployment configuration
     */
    getDefaultConfig: () => DeploymentConfig.getDefaultConfig(),

    /**
     * Load deployment configuration by name
     */
    loadConfig: (configName: string = 'default') =>
        DeploymentConfig.load(configName),

    /**
     * Create signature provider for current environment
     */
    createSignatureProvider: (hre: HardhatRuntimeEnvironment) =>
        SignatureProviderFactory.create(hre),

    /**
     * Create pre-commit validator
     */
    createValidator: (
        hre: HardhatRuntimeEnvironment,
        result: DeploymentResult,
        config: DeploymentConfig
    ) => new PreCommitValidator(hre, result, config),

    /**
     * Check if debug mode is enabled
     */
    isDebug: () => isDebug(),
}

/**
 * Deployment utilities and helpers
 */
export const deployment = {
    /**
     * Core orchestrators
     */
    orchestrator: {
        create: tasks.createOrchestrator,
        createClean: tasks.createCleanOrchestrator,
    },

    /**
     * Configuration management
     */
    config: {
        getDefault: tasks.getDefaultConfig,
        load: tasks.loadConfig,
        constants: {
            BUSINESS_LOGIC_DEFINITIONS,
            DEFAULT_USE_CASE_CONFIGURATIONS,
            DEFAULT_GOVERNANCE_CONFIG,
        },
    },

    /**
     * Signature providers
     */
    signatures: {
        factory: SignatureProviderFactory,
        create: tasks.createSignatureProvider,
        secp256k1: Secp256k1SignatureProvider,
        secp256r1: Secp256r1SignatureProvider,
    },

    /**
     * Validation utilities
     */
    validation: {
        createValidator: tasks.createValidator,
        PreCommitValidator,
    },

    /**
     * Deployment utilities
     */
    utils: {
        tableRenderer: DeploymentTableRenderer,
        tableExporter: TableExporter,
        bytecodeExtractor: BytecodeExtractor,
    },
}

/**
 * Development utilities for tasks
 */
export const dev = {
    /**
     * Enable debug logging programmatically (for testing)
     */
    enableDebug: () => {
        process.env.DEBUG = 'true'
    },

    /**
     * Disable debug logging programmatically (for testing)
     */
    disableDebug: () => {
        delete process.env.DEBUG
    },

    /**
     * Suppress all logging (useful for tests)
     */
    suppressLogging: () => suppressLogging(),
}

// Default export for convenience
export default {
    // Main API
    ...tasks,

    // Organized modules
    deployment,
    dev,

    // Core classes
    DeploymentOrchestrator,
    DeploymentConfig,
    PreCommitValidator,
    SignatureProviderFactory,
    logger,

    // Quick access functions
    createOrchestrator: tasks.createOrchestrator,
    getDefaultConfig: tasks.getDefaultConfig,
    isDebug,
}
