// SPDX-License-Identifier: Apache-2.0

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
pragma solidity ^0.8.28;

import {INameResolver} from './profiles/name/INameResolver.sol';
import {ITextResolver} from './profiles/text/ITextResolver.sol';
import {IEnsResolver} from './ensresolver/IEnsResolver.sol';
import {IPubkeyResolver} from './profiles/pubkey/IPubkeyResolver.sol';

/**
 * @title ENS Public Resolver Interface
 * @notice Interface for the canonical ENS resolver providing comprehensive name resolution
 *         services with delegation and approval mechanisms
 * @dev Extends name and text resolution capabilities with fine-grained permission management
 *      for operators and delegates across ENS node operations
 * @author ISBE Development Team
 */
// solhint-disable-next-line no-empty-blocks
interface IPublicResolver is
    IEnsResolver,
    INameResolver,
    ITextResolver,
    IPubkeyResolver
{}
