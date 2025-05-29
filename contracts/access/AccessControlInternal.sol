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

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
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

    function _grantRole(bytes32 role, address account) internal {
        if (_hasRole(role, account)) return;

        _accessControlStorage().roles[role].members[account] = true;
        emit IAccessControl.RoleGranted(role, account, _msgSender());
    }

    function _revokeRole(bytes32 role, address account) internal virtual {
        if (!_hasRole(role, account)) return;

        _accessControlStorage().roles[role].members[account] = false;
        emit IAccessControl.RoleRevoked(role, account, _msgSender());
    }

    function _hasRole(
        bytes32 role,
        address account
    ) internal view returns (bool) {
        return _accessControlStorage().roles[role].members[account];
    }

    function _getRoleAdmin(bytes32 role) internal view returns (bytes32) {
        return _accessControlStorage().roles[role].adminRole;
    }

    function _checkRole(bytes32 role) internal view {
        _checkRole(role, _msgSender());
    }

    function _checkRole(bytes32 role, address account) internal view {
        if (!_hasRole(role, account)) {
            revert IAccessControl.AccountHasNoRole(account, role);
        }
    }

    /// @notice Returns the storage slot for access control
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The access control storage struct
    function _accessControlStorage()
        internal
        pure
        returns (AccessControlStorage storage storage_)
    {
        bytes32 position = _ACCESS_CONTROL_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
