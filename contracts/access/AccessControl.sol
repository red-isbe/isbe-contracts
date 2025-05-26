// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from './IAccessControl.sol';
import {AccessControlInternal} from './AccessControlInternal.sol';

contract AccessControl is IAccessControl, AccessControlInternal {
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function grantRole(
        bytes32 role,
        address account
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    function revokeRole(
        bytes32 role,
        address account
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    function setRoleAdmin(
        bytes32 role,
        bytes32 adminRole
    ) external virtual override onlyRole(_getRoleAdmin(role)) {
        _setRoleAdmin(role, adminRole);
    }

    function renounceRole(bytes32 role) external virtual override {
        _revokeRole(role, _msgSender());
    }

    function hasRole(
        bytes32 role,
        address account
    ) external view virtual override returns (bool) {
        return _hasRole(role, account);
    }

    function getRoleAdmin(
        bytes32 role
    ) external view virtual override returns (bytes32) {
        return _getRoleAdmin(role);
    }
}
