/**
 * Configuration-specific types
 */

export interface ConfigurationFilter {
    categories?: string[]
    extensions?: string[]
    includePatterns?: string[]
    excludePatterns?: string[]
}

export interface ConfigurationPreset {
    name: string
    description: string
    configurations: string[]
}

export const CONFIGURATION_PRESETS: Record<string, ConfigurationPreset> = {
    minimal: {
        name: 'Minimal',
        description: 'Configuraciones mínimas básicas',
        configurations: [
            'ERC20_BASE',
            'ERC721_BASE',
            'HASH_TIMESTAMP',
            'PUBLIC_RESOLVER',
        ],
    },
    essentials: {
        name: 'Essentials',
        description: 'Configuraciones esenciales más utilizadas',
        configurations: [
            // ERC20
            'ERC20_BASE',
            'ERC20_BURNABLE',
            'ERC20_SNAPSHOT',
            'ERC20_BURNABLE_SNAPSHOT',
            // ERC721
            'ERC721_BASE',
            'ERC721_BURNABLE',
            'ERC721_ENUMERABLE',
            'ERC721_BURNABLE_ENUMERABLE',
            // Utility
            'HASH_TIMESTAMP',
            'OWNABLE',
            // ENS
            'PUBLIC_RESOLVER',
        ],
    },
    complete: {
        name: 'Complete',
        description: 'Todas las configuraciones disponibles',
        configurations: [], // Se llena dinámicamente
    },
}
