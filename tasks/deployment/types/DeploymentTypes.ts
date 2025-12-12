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
import { IIsbeFactory } from '../../../typechain-types'
import { Signer } from 'ethers'

export interface BusinessLogicConfig {
    description: string
    key: string
    contractName: string
    artifactPath: string
}

export interface GovernanceConfig {
    accountAddress?: string
    initData: string
}

export interface UseCaseConfig {
    description: string
    configurationId: string
    type: string
    businessLogicKeys: string[]
    versions: number[]
    rbacs: RbacConfig[]
    initPause: boolean
    initBusinessIds: string[]
    initCallData: string[]
}

export interface RbacConfig {
    role: string
    members: string[]
}

export interface ERC20UseCaseConfig extends UseCaseConfig {
    type: 'erc20'
    isOwnable: boolean
}

export interface AssetEventTrackerUseCaseConfig extends UseCaseConfig {
    type: 'asset_tracker'
    trackingEnabled: boolean
    eventFilters: string[]
}

export interface DeployedBusinessLogic {
    config: BusinessLogicConfig
    address: string | null
    success: boolean
    error: string | null
}

export interface DeployedUseCase {
    config: UseCaseConfig
    proxyAddress: string | null
    success: boolean
    error: string | null
}

export interface DeployedGovernance {
    address: string
    factory: IIsbeFactory
    signer: Signer // We can keep this as Signer from the ethers package
    config: GovernanceConfig
}

export interface ValidationResult {
    type: 'governance' | 'businessLogics' | 'useCases' | 'error'
    success: boolean
    address?: string
    total?: number
    successful?: number
    failed?: number
    validated?: number
    businessLogicsCount?: number
    error?: string
    errors?: Array<{
        key?: string
        configId?: string
        error: string
    }>
}

export interface DeploymentResult {
    governance: DeployedGovernance | null
    businessLogics: DeployedBusinessLogic[]
    useCases: DeployedUseCase[]
    validationResults: ValidationResult[]
    summary: {
        totalSteps: number
        completedSteps: number
        startTime: Date
        endTime: Date | null
        success: boolean
    }
}

export interface DeploymentOptions {
    skipBusinessLogics?: boolean
    skipUseCases?: boolean
    skipTests?: boolean
}

// Additional types for specific use cases
export interface DIDRegistryUseCaseConfig extends UseCaseConfig {
    type: 'did_registry'
}

export interface ERC721UseCaseConfig extends UseCaseConfig {
    type: 'erc721'
}

export interface HashTimestampUseCaseConfig extends UseCaseConfig {
    type: 'hash_timestamp'
}

// Types for business logic configuration in the factory
export interface BusinessLogicFactoryConfig {
    businessId: string
    version: number
}

// Types for export results
export interface ExportData {
    deployment: {
        timestamp: string
        duration: number | null
        success: boolean
        network: string
    }
    governance: {
        address: string | null
        success: boolean
    }
    businessLogics: {
        total: number
        successful: number
        failed: number
        items: Array<{
            description: string
            key: string
            address: string | null
            success: boolean
            error: string | null
        }>
    }
    useCases: {
        total: number
        successful: number
        failed: number
        items: Array<{
            name: string
            type: string
            configurationId: string
            proxyAddress: string | null
            success: boolean
            error: string | null
            businessLogicsCount: number
        }>
    }
}

export interface ValidationConstants {
    CONFIG_ID: string
    PAUSE_ROLE: string
    CUSTOM_BUSINESS_LOGIC_ID: string
    DEFAULT_BUSINESS_LOGICS_IDS: string[]
    USE_CASE_ROLES: string[]
    DUMB_ROLE: string
    DUMB_ROLE_2: string
}

export interface UseCaseFilterConfig {
    enabled: boolean
    includePatterns: string[]
    excludePatterns: string[]
    categories: string[]
}

export interface SelectiveDeploymentConfig {
    description: string
    version: string
    includeAllBusinessLogics: boolean
    useCaseFilters: UseCaseFilterConfig
    metadata?: {
        author?: string
        created?: string
        purpose?: string
    }
}
