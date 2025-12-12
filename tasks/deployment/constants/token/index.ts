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
