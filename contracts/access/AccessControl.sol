// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from './IAccessControl.sol';
import {AccessControlInternal} from './AccessControlInternal.sol';

/// @title AccessControl
/// @notice Implements role-based access control mechanisms
/// @dev Inherits from IAccessControl and AccessControlInternal, providing external role management functions
contract AccessControl is IAccessControl, AccessControlInternal {
    /// @notice Constructor that assigns the deployer as the default admin
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @notice Grants a role to an account
    /// @dev Caller must have the admin role for the given role
    /// @param role The role identifier (bytes32 hash)
    /// @param account The address to which the role is granted
    function grantRole(
        bytes32 role,
        address account
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /// @notice Revokes a role from an account
    /// @dev Caller must have the admin role for the given role
    /// @param role The role identifier (bytes32 hash)
    /// @param account The address from which the role is revoked
    function revokeRole(
        bytes32 role,
        address account
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /// @notice Changes the admin role of a given role
    /// @dev Caller must have the current admin role for the role
    /// @param role The role whose admin role is being changed
    /// @param adminRole The new admin role to assign
    function setRoleAdmin(
        bytes32 role,
        bytes32 adminRole
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _setRoleAdmin(role, adminRole);
    }

    /// @notice Allows the caller to renounce a role they hold
    /// @dev Can only be called by the account itself to renounce its own role
    /// @param role The role to renounce
    function renounceRole(bytes32 role) external virtual override {
        _revokeRole(role, _msgSender());
    }

    /// @notice Checks if an account has a specific role
    /// @param role The role identifier (bytes32 hash)
    /// @param account The address to check
    /// @return True if the account has the role, false otherwise
    function hasRole(
        bytes32 role,
        address account
    ) external view virtual override returns (bool) {
        return _hasRole(role, account);
    }

    /// @notice Returns the admin role associated with a specific role
    /// @param role The role to query
    /// @return The admin role that controls the given role
    function getRoleAdmin(
        bytes32 role
    ) external view virtual override returns (bytes32) {
        return _getRoleAdmin(role);
    }
}
