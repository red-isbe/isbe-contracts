import { TokenConfiguration, TokenType, BaseTokenConfig } from './types'
import { DEFAULT_VERSION } from './version'
import { UseCaseConfig } from '../types/DeploymentTypes'

import { buildConfigurationId } from '../utils/configurationUtils'
export function createTokenConfig(
    config: TokenConfiguration,
    type: TokenType,
    description: string
): UseCaseConfig {
    const baseConfig: BaseTokenConfig = {
        description,
        type,
        rbacs: [],
        initPause: false,
        initBusinessIds: [],
        initCallData: [],
        isOwnable: false,
    }

    return {
        ...baseConfig,
        configurationId: config.id,
        businessLogicKeys: config.resolver_keys,
        versions: Array(config.resolver_keys.length).fill(DEFAULT_VERSION),
    }
}

export function generateTokenConfiguration(
    baseKey: string,
    configurationId: string,
    keys: string[]
): TokenConfiguration {
    // Ensure base key is included
    const allKeys = keys.includes(baseKey) ? keys : [baseKey, ...keys]

    // Sort keys to ensure consistent order
    const orderedKeys = [...allKeys].sort()

    // Generate new configuration ID using the buildConfigurationId algorithm
    const newConfigId = buildConfigurationId(configurationId, orderedKeys)

    return {
        resolver_keys: orderedKeys,
        id: newConfigId,
    }
}

export function combineResolverKeys(
    mainKey: string,
    additionalKeys: string[]
): string[] {
    return [mainKey, ...additionalKeys]
}

export function createBaseConfig(
    baseKey: string,
    configurationId: string
): TokenConfiguration {
    return {
        resolver_keys: [baseKey],
        id: configurationId,
    }
}
