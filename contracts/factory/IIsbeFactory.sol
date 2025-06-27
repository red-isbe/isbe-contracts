// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IBusinessLogicFactory} from './businesslogic/IBusinessLogicFactory.sol';
import {IProxyFactory} from './proxyfactory/IProxyFactory.sol';

/// @title ISBE Universal Factory Interface
/// @author ISBE
/// @notice A comprehensive factory interface that unifies business logic and proxy deployment.
/// @dev This interface consolidates the `IBusinessLogicFactory` and `IProxyFactory` interfaces,
///      providing a single point of entry for all contract deployment and management operations
///      within the ISBE ecosystem. It inherits all functions, events, and errors from its
///      parent interfaces and does not introduce any new elements. For implementation details,
///      please refer to the `IBusinessLogicFactory` and `IProxyFactory` documentation.
// solhint-disable-next-line no-empty-blocks
interface IIsbeFactory is IBusinessLogicFactory, IProxyFactory {}
