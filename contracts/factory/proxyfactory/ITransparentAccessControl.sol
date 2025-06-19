// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from '../../access/accessControl/IAccessControl.sol';

/// @title Interface for Transparent Access Control Initialisation
/// @author ISBE
/// @notice This interface defines the functions and events required for setting up
///         the initial Role-Based Access Control (RBAC) configuration.
/// @dev It is designed to be used in contexts, such as with transparent upgradeable
///      proxies, where a distinct, one-off function call is needed to initialise the
///      access control settings after deployment.
interface ITransparentAccessControl {
    /// @notice This event is emitted when the RBAC roles have been successfully initialised.
    /// @dev It signals that the `initializeRbacs` function has been completed.
    /// @param rbacs An array of the RBAC structures that have been configured.
    event RbacsInitialized(IAccessControl.Rbac[] rbacs);

    /// @notice Initialises the contract with a set of Role-Based Access Control configurations.
    /// @dev This is intended to be a one-time function call, executed right after the contract's
    ///      deployment to establish all necessary roles and their permissions from the outset.
    ///      Calling this function should set up the complete access control scheme for the contract.
    /// @param rbacs An array of `IAccessControl.Rbac` structures, each defining a role and its permissions.
    function initializeRbacs(IAccessControl.Rbac[] memory rbacs) external;
}
