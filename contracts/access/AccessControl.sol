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

    /// @inheritdoc IAccessControl
    function grantRole(
        bytes32 role,
        address account
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /// @inheritdoc IAccessControl
    function revokeRole(
        bytes32 role,
        address account
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /// @inheritdoc IAccessControl
    function setRoleAdmin(
        bytes32 role,
        bytes32 adminRole
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _setRoleAdmin(role, adminRole);
    }

    /// @inheritdoc IAccessControl
    function renounceRole(bytes32 role) external virtual override {
        _revokeRole(role, _msgSender());
    }

    /// @inheritdoc IAccessControl
    function hasRole(
        bytes32 role,
        address account
    ) external view virtual override returns (bool) {
        return _hasRole(role, account);
    }

    /// @inheritdoc IAccessControl
    function getRoleAdmin(
        bytes32 role
    ) external view virtual override returns (bytes32) {
        return _getRoleAdmin(role);
    }
}
