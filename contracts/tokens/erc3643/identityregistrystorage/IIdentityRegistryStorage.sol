// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    IIdentityStorageRegistryManagement
} from './modules/IIdentityStorageRegistryManagement.sol';
import {
    IIdentityStorageManagement
} from './modules/IIdentityStorageManagement.sol';

/**
 * @title IIdentityRegistryStorage
 * @notice Interface to manage storage identitys and their linked registries
 * @dev Combines identity lifecycle operationss and registry binding logic
 * @author ISBE
 */
// solhint-disable-next-line no-empty-blocks
interface IIdentityRegistryStorage is
    IIdentityStorageRegistryManagement,
    IIdentityStorageManagement
{}
