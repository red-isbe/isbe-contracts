// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {Pause} from './Pause.sol';
import {_PAUSER_ROLE, _ISBE_ROLE} from '../constants/roles.sol';
import {AccessControl} from '../access/AccessControl.sol';

contract ISBEPause is Pause, AccessControl {
    uint256 private constant _DEFAULT_AUTHORIZATION_LEVEL = 0;

    uint256 private constant _PAUSER_AUTHORIZATION_LEVEL = 1000;

    uint256 private constant _ISBE_AUTHORIZATION_LEVEL = type(uint256).max;

    function _checkPauserRoles() internal view virtual override {
        bytes32[] memory roles = new bytes32[](2);
        roles[0] = _PAUSER_ROLE;
        roles[1] = _ISBE_ROLE;

        _checkRoles(roles);
    }

    function _getAuthorityLevel(
        address _account
    ) internal view virtual override returns (uint256) {
        if (_hasRole(_PAUSER_ROLE, _account))
            return _PAUSER_AUTHORIZATION_LEVEL;
        if (_hasRole(_ISBE_ROLE, _account)) return _ISBE_AUTHORIZATION_LEVEL;
        return _DEFAULT_AUTHORIZATION_LEVEL;
    }
}
