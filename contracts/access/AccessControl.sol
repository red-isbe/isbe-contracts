// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAccessControl} from './IAccessControl.sol';
import {AccessControlInternal} from './AccessControlInternal.sol';

abstract contract AccessControl is IAccessControl, AccessControlInternal {
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

    function renounceRole(
        bytes32 role,
        address account
    ) external virtual override {
        if (account != _msgSender()) revert CallerNotRoleHolder(_msgSender());

        _revokeRole(role, account);
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
