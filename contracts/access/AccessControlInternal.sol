// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    _ACCESS_CONTROL_STORAGE_POSITION
} from '../constants/storagePositions.sol';
import {IAccessControl} from './IAccessControl.sol';
import {ISBEContext} from '../utils/ISBEContext.sol';

abstract contract AccessControlInternal is ISBEContext {
    struct AccessControlStorage {
        mapping(bytes32 => RoleData) roles;
    }

    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = _getRoleAdmin(role);
        if (previousAdminRole == adminRole) return;
        _accessControlStorage().roles[role].adminRole = adminRole;
        emit IAccessControl.RoleAdminChanged(
            role,
            previousAdminRole,
            adminRole
        );
    }

    function _grantRole(bytes32 role, address account) internal virtual {
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
    ) internal view virtual returns (bool) {
        return _accessControlStorage().roles[role].members[account];
    }

    function _getRoleAdmin(
        bytes32 role
    ) internal view virtual returns (bytes32) {
        return _accessControlStorage().roles[role].adminRole;
    }

    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!_hasRole(role, account)) {
            revert IAccessControl.AccountHasNoRole(account, role);
        }
    }

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
