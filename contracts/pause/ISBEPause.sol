// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {Pause} from './Pause.sol';
import {AccessControl} from '../access/AccessControl.sol';
import {_PAUSER_ROLE, _ISBE_ROLE} from '../constants/roles.sol';

contract ISBEPause is Pause, AccessControl {
    uint256 private constant _DEFAULT_AUTHORIZATION_LEVEL = 0;

    uint256 private constant _PAUSER_AUTHORIZATION_LEVEL = 1;

    uint256 private constant _ISBE_AUTHORIZATION_LEVEL = 2;

    function _getAuthorityLevel(
        address _account
    ) internal view override returns (uint256) {
        if (_hasRole(_PAUSER_ROLE, _account))
            return _PAUSER_AUTHORIZATION_LEVEL;
        if (_hasRole(_ISBE_ROLE, _account)) return _ISBE_AUTHORIZATION_LEVEL;
        return _DEFAULT_AUTHORIZATION_LEVEL;
    }
}
