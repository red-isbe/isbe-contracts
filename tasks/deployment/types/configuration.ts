import { Provider, Signer } from 'ethers'

export enum TokenType {
    ERC20 = 'erc20',
    ERC721 = 'erc721',
}

export interface Extension {
    key: string
    name: string
    dependencies?: string[]
}

export interface TokenConfiguration {
    resolver_keys: string[]
    id: string
}

export interface BaseTokenConfig {
    description: string
    type: TokenType
    isOwnable: boolean
    rbacs: string[]
    initPause: boolean
    initBusinessIds: string[]
    initCallData: string[]
}

export interface ValidationResult {
    isValid: boolean
    errors?: string[]
}

export interface ConfigurationValidator {
    validate(config: TokenConfiguration): ValidationResult
}

export interface DeploymentEnvironment {
    network: string
    provider: Provider
    signer: Signer
    deploymentOptions: DeploymentOptions
}

export interface DeploymentOptions {
    gasPrice?: bigint
    gasLimit?: bigint
    nonce?: number
    maxRetries?: number
    retryDelay?: number
}

export interface DeploymentResult {
    success: boolean
    proxyAddress?: string
    error?: Error
    configurationId: string
    transactionHash?: string
}

export interface DeploymentEvent {
    type: 'start' | 'success' | 'error' | 'complete'
    useCaseConfig: TokenConfiguration
    error?: Error
}

export class ConfigurationError extends Error {
    constructor(
        message: string,
        public config: TokenConfiguration
    ) {
        super(message)
        this.name = 'ConfigurationError'
    }
}

export class DeploymentError extends Error {
    constructor(
        message: string,
        public config: TokenConfiguration,
        public cause?: Error
    ) {
        super(message)
        this.name = 'DeploymentError'
    }
}

export interface DeploymentLogger {
    logDeployment(event: DeploymentEvent): void
    logConfiguration(config: TokenConfiguration): void
    logError(error: Error): void
}

export interface DeploymentStrategy {
    deploy(
        config: TokenConfiguration,
        env: DeploymentEnvironment
    ): Promise<DeploymentResult>
}
