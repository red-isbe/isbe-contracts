// SPDX-License-Identifier: UNLICENSED
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
