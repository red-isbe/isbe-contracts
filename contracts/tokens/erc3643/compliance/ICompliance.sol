// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IBind} from './modules/binding/IBind.sol';
import {IHooks} from './modules/hooks/IHooks.sol';

/**
 * @title ICompliance
 * @notice Interface for comprehensive token compliance management
 * @dev Combines token binding and lifecycle hooks for complete compliance control
 * @author ISBE
 */
// solhint-disable-next-line no-empty-blocks
interface ICompliance is IBind, IHooks {}
