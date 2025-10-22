import fs from 'fs'
import path from 'path'
import {
    BusinessLogicConfig,
    UseCaseConfig,
    GovernanceConfig,
    ValidationConstants,
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
        public useCases: UseCaseConfig[],
        public isbeAdmin?: string
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
        return new DeploymentConfig(
            DEFAULT_GOVERNANCE_CONFIG,
            BUSINESS_LOGIC_DEFINITIONS.slice(), // Create a copy to avoid mutations
            DEFAULT_USE_CASE_CONFIGURATIONS.slice() // Create a copy to avoid mutations
        )
    }

    public setIsbeAdmin(address: string) {
        this.isbeAdmin = address
    }   
}
