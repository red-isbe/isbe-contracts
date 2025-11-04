import {
    BaseTokenConfig,
    TokenConfiguration,
    TokenType,
    Extension,
} from '../types/configuration'
import { generateTokenConfiguration } from '../constants/configHelpers'
import { CONFIGURATION_IDS } from '../constants/configurationIds'

export class TokenConfigurationBuilder {
    private extensions: Extension[] = []
    private baseConfig: BaseTokenConfig
    private resolverKeys: string[] = []

    constructor(type: TokenType, description: string) {
        this.baseConfig = {
            description,
            type,
            isOwnable: false,
            rbacs: [],
            initPause: false,
            initBusinessIds: [],
            initCallData: [],
        }
    }

    addExtension(extension: Extension): this {
        // Validate dependencies before adding
        if (extension.dependencies) {
            const missingDeps = extension.dependencies.filter(
                (dep) => !this.extensions.some((e) => e.key === dep)
            )
            if (missingDeps.length > 0) {
                throw new Error(
                    `Missing required dependencies: ${missingDeps.join(', ')}`
                )
            }
        }

        this.extensions.push(extension)
        if (extension.key) {
            this.resolverKeys.push(extension.key)
        }
        return this
    }

    setOwnable(isOwnable: boolean): this {
        this.baseConfig.isOwnable = isOwnable
        return this
    }

    addRbac(rbac: string): this {
        this.baseConfig.rbacs.push(rbac)
        return this
    }

    setInitialPause(paused: boolean): this {
        this.baseConfig.initPause = paused
        return this
    }

    addBusinessId(businessId: string): this {
        this.baseConfig.initBusinessIds.push(businessId)
        return this
    }

    addCallData(callData: string): this {
        this.baseConfig.initCallData.push(callData)
        return this
    }

    build(): TokenConfiguration {
        // Get base resolver key based on token type
        const baseKey = this.getBaseKey(this.baseConfig.type)
        const configId = this.getConfigId(this.baseConfig.type)

        // Generate configuration with base key and extensions
        const allKeys = [baseKey, ...this.resolverKeys]
        return generateTokenConfiguration(baseKey, configId, allKeys)
    }

    private getBaseKey(type: TokenType): string {
        switch (type) {
            case TokenType.ERC20:
                return 'ERC20_BASE_KEY' // Replace with actual key from resolver keys
            case TokenType.ERC721:
                return 'ERC721_BASE_KEY' // Replace with actual key from resolver keys
            default:
                throw new Error(`Unsupported token type: ${type}`)
        }
    }

    private getConfigId(type: TokenType): string {
        switch (type) {
            case TokenType.ERC20:
                return CONFIGURATION_IDS.ERC20
            case TokenType.ERC721:
                return CONFIGURATION_IDS.ERC721
            default:
                throw new Error(`Unsupported token type: ${type}`)
        }
    }
}
