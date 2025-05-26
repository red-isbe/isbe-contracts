// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _ACCESS_CONTROL_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {IAccessControl} from './IAccessControl.sol';
import {ISBEContext} from '../utils/ISBEContext.sol';

/// @title AccessControlInternal
/// @notice Internal logic for role-based access control
/// @dev Meant to be used only by contracts extending AccessControl
abstract contract AccessControlInternal is ISBEContext {
    /// @notice Struct storing all roles and their data
    struct AccessControlStorage {
        mapping(bytes32 => RoleData) roles;
    }

    /// @notice Struct storing members and admin role for a specific role
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    /// @notice Constant value representing the default admin role
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /// @notice Modifier to restrict function to accounts with a specific role
    /// @param role The required role
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @notice Internal function to set a new admin role for a role
    /// @param role The role being updated
    /// @param adminRole The new admin role
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = _getRoleAdmin(role);
        if (previousAdminRole == adminRole) return;
        _accessControlStorage().roles[role].adminRole = adminRole;
        emit IAccessControl.RoleAdminChanged(
            role,
            previousAdminRole,
            adminRole,
            _msgSender()
        );
    }

    /// @notice Internal function to grant a role to an account
    /// @param role The role to grant
    /// @param account The address receiving the role
    function _grantRole(bytes32 role, address account) internal virtual {
        if (_hasRole(role, account)) return;

        _accessControlStorage().roles[role].members[account] = true;
        emit IAccessControl.RoleGranted(role, account, _msgSender());
    }

    /// @notice Internal function to revoke a role from an account
    /// @param role The role to revoke
    /// @param account The address losing the role
    function _revokeRole(bytes32 role, address account) internal virtual {
        if (!_hasRole(role, account)) return;

        _accessControlStorage().roles[role].members[account] = false;
        emit IAccessControl.RoleRevoked(role, account, _msgSender());
    }

    /// @notice Internal function to check if an account has a role
    /// @param role The role to check
    /// @param account The account to verify
    /// @return True if the account has the role, false otherwise
    function _hasRole(
        bytes32 role,
        address account
    ) internal view virtual returns (bool) {
        return _accessControlStorage().roles[role].members[account];
    }

    /// @notice Internal function to get the admin role of a role
    /// @param role The role to query
    /// @return The admin role controlling the queried role
    function _getRoleAdmin(
        bytes32 role
    ) internal view virtual returns (bytes32) {
        return _accessControlStorage().roles[role].adminRole;
    }

    /// @notice Internal function to check that the msg.sender has a specific role
    /// @param role The role required
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /// @notice Internal function to check that an account has a specific role
    /// @param role The role required
    /// @param account The address to check
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!_hasRole(role, account)) {
            revert IAccessControl.AccountHasNoRole(account, role);
        }
    }

    /// @notice Returns the storage slot for access control
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return accessControlStorage_ The access control storage struct
    function _accessControlStorage()
        internal
        pure
        returns (AccessControlStorage storage accessControlStorage_)
    {
        bytes32 position = _ACCESS_CONTROL_STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            accessControlStorage_.slot := position
        }
    }
}
