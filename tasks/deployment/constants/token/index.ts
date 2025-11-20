export { ERC20_DEFINITIONS } from './erc20'
export { ERC721_DEFINITIONS } from './erc721'
export { ERC3643_DEFINITIONS, ERC203643_SHARED_DEFINITIONS } from './erc3643'
export { WHITELIST_DEFINITIONS } from './whitelist'

export const TOKEN_DEFINITIONS = [
    ...(import('./erc20').then(
        (module) => module.ERC20_DEFINITIONS
    ) as unknown as unknown[]),
    ...(import('./erc721').then(
        (module) => module.ERC721_DEFINITIONS
    ) as unknown as unknown[]),
    ...(import('./erc3643').then(
        (module) => module.ERC3643_DEFINITIONS
    ) as unknown as unknown[]),
]
