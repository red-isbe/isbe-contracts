// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import {IPause} from './IPause.sol';
import {Common} from '../core/Common.sol';

/// @title PauseInternal
/// @notice Internal logic for pausing mechanism
abstract contract PauseInternal is Common {
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
