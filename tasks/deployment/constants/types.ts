export interface TokenConfiguration {
    resolver_keys: string[]
    id: string
}

export interface TokenConfigurations {
    BASE: TokenConfiguration
    [key: string]: TokenConfiguration
}

export interface ResolverKeys {
    [key: string]: string
}

export interface ConfigurationIds {
    [key: string]: string
}

export type TokenType = 'erc20' | 'erc721' | 'erc3643'

export interface RbacConfig {
    role: string
    account: string
    curve?: string
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
