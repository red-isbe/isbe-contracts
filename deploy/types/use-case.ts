/**
 * Use Case-specific types
 */

import { ConfigurationCategory } from './index'

export interface UseCaseFilter {
    categories?: ConfigurationCategory[]
    extensions?: string[]
    includePatterns?: string[]
    excludePatterns?: string[]
}

export interface UseCaseTemplate {
    name: string
    category: ConfigurationCategory
    baseConfig: string
    extensions: string[]
    description: string
}

export const ERC20_EXTENSIONS = [
    'burnable',
    'capped',
    'controller',
    'snapshot',
] as const

export const ERC721_EXTENSIONS = [
    'burnable',
    'enumerable',
    'capped',
    'controller',
    'snapshot',
    'royalty',
    'consecutive',
] as const

export type ERC20Extension = (typeof ERC20_EXTENSIONS)[number]
export type ERC721Extension = (typeof ERC721_EXTENSIONS)[number]
export type TokenExtension = ERC20Extension | ERC721Extension

export function isValidERC20Extension(ext: string): ext is ERC20Extension {
    return ERC20_EXTENSIONS.includes(ext as ERC20Extension)
}

export function isValidERC721Extension(ext: string): ext is ERC721Extension {
    return ERC721_EXTENSIONS.includes(ext as ERC721Extension)
}

export function isValidTokenExtension(ext: string): ext is TokenExtension {
    return isValidERC20Extension(ext) || isValidERC721Extension(ext)
}
