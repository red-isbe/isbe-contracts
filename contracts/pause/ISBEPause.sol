// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */

pragma solidity ^0.8.28;

import {Pause} from './Pause.sol';
import {_PAUSER_ROLE, _ISBE_ROLE} from '../constants/roles.sol';

/// @title ISBEPause
/// @notice Implements pausing mechanism for ISBE project
/// @dev Inherits from Pause and implements the abstract methods according to ISBE functional requirements
abstract contract ISBEPause is Pause {
    uint256 private constant _DEFAULT_AUTHORIZATION_LEVEL = 0;

    uint256 private constant _PAUSER_AUTHORIZATION_LEVEL = 1000;

    uint256 private constant _ISBE_AUTHORIZATION_LEVEL = type(uint256).max;

    function _checkPauserRoles() internal view override {
        bytes32[] memory roles = new bytes32[](2);
        roles[0] = _PAUSER_ROLE;
        roles[1] = _ISBE_ROLE;

        _checkRoles(roles);
    }

    function _getAuthorityLevel(
        address _account
    ) internal view override returns (uint256) {
        if (_hasRole(_PAUSER_ROLE, _account))
            return _PAUSER_AUTHORIZATION_LEVEL;
        if (_hasRole(_ISBE_ROLE, _account)) return _ISBE_AUTHORIZATION_LEVEL;
        return _DEFAULT_AUTHORIZATION_LEVEL;
    }
}
