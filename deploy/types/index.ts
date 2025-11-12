/**
 * ISBE Deployment Types
 *
 * Tipos TypeScript compartidos para todo el sistema de despliegue
 */

// ============================================================================
// NETWORK TYPES
// ============================================================================

export enum Network {
    // secp256k1 networks
    HARDHAT = 'hardhat',
    MVP = 'mvp',
    ARSYS = 'arsys',
    KEPLER = 'kepler',
    DEV = 'dev',

    // secp256r1 networks
    CUSTOM_R1 = 'customR1Network',
    BARE = 'bare',
}

export enum CurveType {
    SECP256K1 = 'secp256k1',
    SECP256R1 = 'secp256r1',
}

export interface NetworkConfig {
    name: string
    chainId: number
    url: string
    curve: CurveType
    gasPrice?: number
    gas?: number
    blockGasLimit?: number
}

// ============================================================================
// DEPLOYMENT TYPES
// ============================================================================

export enum DeploymentPhase {
    GOVERNANCE = 'governance',
    BUSINESS_LOGIC = 'business-logic',
    CONFIGURATIONS = 'configurations',
    USE_CASES = 'use-cases',
}

export enum LogLevel {
    MINIMAL = 'minimal',
    NORMAL = 'normal',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
}

export enum DeploymentPreset {
    MINIMAL = 'minimal',
    ESSENTIALS = 'essentials',
    COMPLETE = 'complete',
    CUSTOM = 'custom',
}

// ============================================================================
// GOVERNANCE TYPES
// ============================================================================

export interface GovernanceConfig {
    accountAddress: string
    isOwnable: boolean
    rbacs: RoleAssignment[]
    initPause: boolean
    initBusinessIds: string[]
    initCallData: string[]
    initData: string
}

export interface GovernanceDeploymentResult {
    address: string
    facets: FacetInfo[]
    roles: RoleInfo[]
    deployer: string
    timestamp: Date
    transactionHash: string
}

export interface RoleAssignment {
    role: string
    account: string
}

export interface RoleInfo {
    name: string
    hash: string
    members: string[]
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

export enum BusinessLogicCategory {
    CORE = 'core',
    TOKEN = 'token',
    IDENTITY = 'identity',
    UTILITY = 'utility',
    CLIENT = 'client',
}

export interface BusinessLogicDefinition {
    name: string
    category: BusinessLogicCategory
    contractName: string
    resolverKey: string
    description: string
    dependencies?: string[]
}

export interface BusinessLogicDeploymentResult {
    name: string
    address: string
    businessId: string
    version: number
    transactionHash: string
    gasUsed: string
}

export interface FacetInfo {
    name: string
    address: string
    selectors: string[]
    interfaceIds: string[]
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ConfigurationDefinition {
    id: string
    name: string
    description: string
    seed: string
    resolverKeys: string[]
    businessLogics: string[]
    category: ConfigurationCategory
}

export enum ConfigurationCategory {
    ERC20 = 'erc20',
    ERC721 = 'erc721',
    ENS = 'ens',
    UTILITY = 'utility',
    CLIENT = 'client',
    CUSTOM = 'custom',
}

export interface ConfigurationDeploymentResult {
    configurationId: string
    name: string
    version: number
    businessLogics: BusinessData[]
    transactionHash: string
}

export interface BusinessData {
    businessId: string
    version: number
}

// ============================================================================
// USE CASE TYPES
// ============================================================================

export interface UseCaseConfig {
    name: string
    description: string
    configurationId: string
    version: number
    rbacs: RoleAssignment[]
    initPause: boolean
    initBusinessIds: string[]
    initData: string
    category: ConfigurationCategory
    extensions?: string[]
}

export interface UseCaseDeploymentResult {
    name: string
    address: string
    configurationId: string
    version: number
    transactionHash: string
    deployer: string
}

// ============================================================================
// DEPLOYMENT OPTIONS
// ============================================================================

export interface DeploymentOptions {
    network: Network
    logLevel?: LogLevel
    preset?: DeploymentPreset
    precommit?: boolean
    debug?: boolean
    skipValidation?: boolean
    skipBusinessLogics?: boolean
    skipConfigurations?: boolean
    skipUseCases?: boolean
    governanceAddress?: string
    configFile?: string
    categories?: ConfigurationCategory[]
    extensions?: string[]
}

export interface SelectiveDeploymentOptions extends DeploymentOptions {
    categories?: ConfigurationCategory[]
    extensions?: string[]
    includePatterns?: string[]
    excludePatterns?: string[]
}

// ============================================================================
// DEPLOYMENT RESULT
// ============================================================================

export interface DeploymentResult {
    network: Network
    curveType: CurveType
    deployer: string
    governance: GovernanceDeploymentResult | null
    businessLogics: BusinessLogicDeploymentResult[]
    configurations: ConfigurationDeploymentResult[]
    useCases: UseCaseDeploymentResult[]
    validationResults: ValidationResult[]
    summary: DeploymentSummary
}

export interface DeploymentSummary {
    totalSteps: number
    completedSteps: number
    startTime: Date
    endTime: Date | null
    success: boolean
    errors?: string[]
    warnings?: string[]
    timings?: Record<string, number>
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
    name: string
    phase: DeploymentPhase
    passed: boolean
    message: string
    details?: unknown
}

export interface ValidationOptions {
    full?: boolean
    quick?: boolean
    governanceAddress?: string
    skipGovernance?: boolean
    skipBusinessLogic?: boolean
    skipConfigurations?: boolean
    skipUseCases?: boolean
}

// ============================================================================
// GENESIS TYPES
// ============================================================================

export interface GenesisOptions {
    network: Network
    template: GenesisTemplate
    outputFile: string
    includeGovernance: boolean
    includeBusinessLogic: boolean
    includeConfigurations: boolean
    includeUseCases: boolean
}

export enum GenesisTemplate {
    BARE = 'bare',
    USECASE = 'usecase',
    CUSTOM = 'custom',
}

export interface GenesisContract {
    contract: string
    address: string
    code: string
    storage: Record<string, string>
    balance?: string
}

// ============================================================================
// UPGRADE TYPES
// ============================================================================

export interface UpgradeOptions {
    network: Network
    facetName: string
    governanceAddress: string
    updateConfigurations: boolean
    logLevel?: LogLevel
}

export interface UpgradeResult {
    facetName: string
    oldAddress: string
    newAddress: string
    newVersion: number
    updatedConfigs: string[]
    transactionHash: string
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface ProviderInfo {
    curve: CurveType
    address: string
    network: string
    chainId: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DeploymentError extends Error {
    constructor(
        message: string,
        public phase: DeploymentPhase,
        public details?: unknown
    ) {
        super(message)
        this.name = 'DeploymentError'
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public validationName: string,
        public details?: unknown
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class NetworkError extends Error {
    constructor(
        message: string,
        public network: string,
        public details?: unknown
    ) {
        super(message)
        this.name = 'NetworkError'
    }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ProgressInfo {
    current: number
    total: number
    percentage: number
    phase: DeploymentPhase
    item?: string
}

export interface TimingInfo {
    operation: string
    duration: number
    startTime: Date
    endTime: Date
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './deployment'
export * from './configuration'
export * from './network'
export * from './business-logic'
export * from './use-case'
