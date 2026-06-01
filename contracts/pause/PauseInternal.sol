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

import {IPause} from './IPause.sol';
import {Common} from '../core/Common.sol';

/// @title PauseInternal
/// @notice Internal logic for pausing mechanism
abstract contract PauseInternal is Common {
    modifier onlySufficientAuthorityLevel() {
        _checkAuthorityLevel();
        _;
    }

    modifier onlyPauserRole() {
        _checkPauserRoles();
        _;
    }

    function _pause() internal virtual {
        PauseStorage storage pauseStorage = _pauseStorage();
        pauseStorage.pause = true;
        pauseStorage.authorityLevel = _getAuthorityLevel(_msgSender());
    }

    function _unpause() internal virtual {
        PauseStorage storage pauseStorage = _pauseStorage();
        pauseStorage.pause = false;
        pauseStorage.authorityLevel = 0;
    }

    function _authorityLevel() internal view virtual returns (uint256) {
        return _pauseStorage().authorityLevel;
    }

    function _checkAuthorityLevel() internal view {
        uint256 senderAuthorityLevel = _getAuthorityLevel(_msgSender());
        uint256 requiredAuthorityLevel = _pauseStorage().authorityLevel;

        require(
            _compareAuthorityLevels(
                senderAuthorityLevel,
                requiredAuthorityLevel
            ),
            IPause.InsufficientAuthorityLevel(
                senderAuthorityLevel,
                requiredAuthorityLevel
            )
        );
    }

    function _getAuthorityLevel(
        address _account
    ) internal view virtual returns (uint256);

    function _checkPauserRoles() internal view virtual;

    function _compareAuthorityLevels(
        uint256 _newLevel,
        uint256 _previousLevel
    ) internal pure virtual returns (bool) {
        if (_newLevel < _previousLevel) return false;
        return true;
    }
}
