// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IGlobalIsbePause} from './globalisbepause/IGlobalIsbePause.sol';
import {IBusinessLogicFactory} from './businesslogic/IBusinessLogicFactory.sol';
import {IProxyFactory} from './proxyfactory/IProxyFactory.sol';
import {IConfigurationManagement} from './configurationmanagement/IConfigurationManagement.sol';

/**
 * @title ISBE Universal Factory Interface
 * @author ISBE
 * @notice A unified interface that aggregates core factory functionalities.
 *         It combines business logic deployment, proxy creation, and global
 *         pausing capabilities into a single, comprehensive API.
 * @dev This interface inherits from `IBusinessLogicFactory`, `IProxyFactory`,
 *      and `IGlobalIsbePause`. It serves as the primary entry point for
 *      all interactions with the ISBE factory contract, defining its
 *      complete external surface.
 */
// solhint-disable-next-line no-empty-blocks
interface IIsbeFactory is
    IBusinessLogicFactory,
    IConfigurationManagement,
    IProxyFactory,
    IGlobalIsbePause
{}
