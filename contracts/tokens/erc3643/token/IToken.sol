// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC3643} from './IERC3643.sol';
import {IRecovery} from './IRecovery.sol';

/**
 * @dev Required interface of an ERC3643 compliant security token contract.
 * @dev Aggregates all ERC3643 management interfaces into a single, unified interface for
 *      complete ERC3643 lifecycle management including controllers, verification
 *      methods, and verification relationships
 */
// solhint-disable-next-line no-empty-blocks
interface IToken is IERC3643, IRecovery {}
