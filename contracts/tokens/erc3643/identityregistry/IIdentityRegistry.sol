// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    IIdentityManagement
} from './modules/identitymanagement/IIdentityManagement.sol';
import {
    IRegistriesManagement
} from './modules/identitymanagement/IRegistriesManagement.sol';
import {IVerification} from './modules/identitymanagement/IVerification.sol';

/**
 * @title IIdentityRegistry
 * @notice Interface for comprehensive identity registry management
 * @dev Combines identity managment, registries management and identity verification
 * @author ISBE
 */
// solhint-disable-next-line no-empty-blocks
interface IIdentityRegistry is
    IIdentityManagement,
    IRegistriesManagement,
    IVerification
{}
