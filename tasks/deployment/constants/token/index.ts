export { ERC20_DEFINITIONS } from './erc20'
export { ERC721_DEFINITIONS } from './erc721'

export const TOKEN_DEFINITIONS = [
    ...(import('./erc20').then(
        (module) => module.ERC20_DEFINITIONS
    ) as unknown as unknown[]),
    ...(import('./erc721').then(
        (module) => module.ERC721_DEFINITIONS
    ) as unknown as unknown[]),
]
