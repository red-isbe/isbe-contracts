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
import fs from 'fs'
import path from 'path'
import {
    BusinessLogicConfig,
    UseCaseConfig,
    GovernanceConfig,
    ValidationConstants,
    SelectiveDeploymentConfig,
    UseCaseFilterConfig,
} from '../types/DeploymentTypes'
import {
    BUSINESS_LOGIC_DEFINITIONS,
    DEFAULT_USE_CASE_CONFIGURATIONS,
    DEFAULT_GOVERNANCE_CONFIG,
} from '../constants/DeploymentConstants'
import { ZeroAddress } from 'ethers'

/**
 * Manages the deployment configuration centrally
 */
export class DeploymentConfig {
    constructor(
        public governance: GovernanceConfig,
        public businessLogics: BusinessLogicConfig[],
        public useCases: UseCaseConfig[]
    ) {}

    validation: ValidationConstants = {
        CONFIG_ID:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        PAUSE_ROLE:
            '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
        CUSTOM_BUSINESS_LOGIC_ID:
            '0xf4e751bf7e74c25f287942d8743e3d0fdfb08f29556e786178a50e2d69dc403a',
        DEFAULT_BUSINESS_LOGICS_IDS: [
            '0x3e325d62f8652528edf5d41ed730a283b473d9e55ee9b6631b261b52199eac25',
            '0x360faa2d547f0a951a5b1da060a4ffb56888bf8ad05db9de4d6d09b3eae1e5e2',
            '0xa4de16c45770db08a06a2cdfeb0229e16d2ff660f7f1bf74c3dc07212770c70c',
            '0x7fabf0f3ed655fa26f86c82ae5da60e0ade03a5d35a9ff2985709278942966d3',
        ],
        USE_CASE_ROLES: [
            ZeroAddress,
            '0x8c911f4537972e7549dbbd37a96b929a4b480f4fb156fc6344524bdf2ca50aa1',
            '0xe02d3eaf0b5fb24a2d637286804770bf2618aa6d3b40cbf443b93f6cd1aac239',
        ],
        DUMB_ROLE:
            '0xfd7c9c0377a2a6c4d8b9979f202e292dafbdfc5571e38d678a0f17ba082ac055',
        DUMB_ROLE_2:
            '0x17cb3e1f7aabf16b3fd269c288ae0a59540f78cdbba8f4f7fa08cd952b850fca',
    }

    static load(configName: string = 'default'): DeploymentConfig {
        const configPath = path.join(
            process.cwd(),
            'deployment-configs',
            `${configName}.json`
        )

        if (!fs.existsSync(configPath)) {
            console.log(
                `⚠️  Configuration '${configName}' not found, using default configuration`
            )
            return this.getDefaultConfig()
        }

        try {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'))

            // Check if this is a selective deployment config
            if (
                configData.useCaseFilters &&
                configData.useCaseFilters.enabled
            ) {
                return this.getSelectiveConfig(
                    configData as SelectiveDeploymentConfig
                )
            }

            return new DeploymentConfig(
                configData.governance,
                configData.businessLogics,
                configData.useCases
            )
        } catch (error) {
            console.warn(
                `⚠️  Error loading configuration '${configName}', using default:${error instanceof Error ? error.message : error}`
            )
            return this.getDefaultConfig()
        }
    }

    static getDefaultConfig(): DeploymentConfig {
        // Create a copy and filter out any undefined or invalid configurations
        const useCases = DEFAULT_USE_CASE_CONFIGURATIONS.slice().filter(
            (cfg) => cfg && cfg.description && cfg.configurationId
        )

        // Validate use cases
        const invalidConfigs = useCases.filter(
            (cfg) => !cfg || !cfg.description
        )
        if (invalidConfigs.length > 0) {
            throw new Error(
                `Invalid use case configuration(s) detected: ${invalidConfigs.length} use case(s) are missing required properties.`
            )
        }

        // Log the number of configured use cases
        console.log(`   📋 Configured use cases: ${useCases.length}`)

        return new DeploymentConfig(
            DEFAULT_GOVERNANCE_CONFIG,
            BUSINESS_LOGIC_DEFINITIONS.slice(), // Create a copy to avoid mutations
            useCases
        )
    }

    /**
     * Create a selective deployment configuration based on filters
     */
    static getSelectiveConfig(
        selectiveConfig: SelectiveDeploymentConfig
    ): DeploymentConfig {
        console.log(
            ` Loading selective deployment: ${selectiveConfig.description}`
        )

        // Start with default business logics (or filter them if needed)
        const businessLogics = selectiveConfig.includeAllBusinessLogics
            ? BUSINESS_LOGIC_DEFINITIONS.slice()
            : BUSINESS_LOGIC_DEFINITIONS.slice() // For now, always include all business logics

        // Start with all default use cases
        let filteredUseCases = DEFAULT_USE_CASE_CONFIGURATIONS.slice()

        // Apply filtering if enabled
        if (selectiveConfig.useCaseFilters.enabled) {
            filteredUseCases = this.filterUseCases(
                filteredUseCases,
                selectiveConfig.useCaseFilters
            )
        }

        console.log(`    Selected use cases: ${filteredUseCases.length}`)
        console.log(`    Business logics: ${businessLogics.length}`)

        return new DeploymentConfig(
            DEFAULT_GOVERNANCE_CONFIG,
            businessLogics,
            filteredUseCases
        )
    }

    /**
     * Filter use cases based on the provided filters
     */
    private static filterUseCases(
        useCases: UseCaseConfig[],
        filters: UseCaseFilterConfig
    ): UseCaseConfig[] {
        let filtered = useCases.slice()

        // Apply include patterns (if any)
        if (filters.includePatterns && filters.includePatterns.length > 0) {
            filtered = filtered.filter((useCase) =>
                filters.includePatterns.some((pattern: string) =>
                    useCase.description
                        .toLowerCase()
                        .includes(pattern.toLowerCase())
                )
            )
        }

        // Apply exclude patterns (if any)
        if (filters.excludePatterns && filters.excludePatterns.length > 0) {
            filtered = filtered.filter(
                (useCase) =>
                    !filters.excludePatterns.some((pattern: string) =>
                        useCase.description
                            .toLowerCase()
                            .includes(pattern.toLowerCase())
                    )
            )
        }

        // Apply category filters (if any)
        if (filters.categories && filters.categories.length > 0) {
            filtered = filtered.filter((useCase) =>
                filters.categories.some((category: string) =>
                    useCase.type.toLowerCase().includes(category.toLowerCase())
                )
            )
        }

        // Log details about filtered results
        if (filters.includePatterns && filters.includePatterns.length > 0) {
            console.log(
                `    Include patterns: ${filters.includePatterns.join(', ')}`
            )
        }
        if (filters.categories && filters.categories.length > 0) {
            console.log(`  Categories: ${filters.categories.join(', ')}`)
        }

        return filtered
    }
}
