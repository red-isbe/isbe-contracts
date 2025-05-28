// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {_PAUSE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {Common} from '../core/Common.sol';
import {IPause} from './IPause.sol';

abstract contract PauseInternal is Common {
    modifier checkAuthorityLevel() {
        uint256 senderAuthorityLevel = _getAuthorityLevel(_msgSender());
        uint256 requiredAuthorityLevel = _pauseStorage().authorityLevel;

        if (
            !_compareAuthorityLevels(
                senderAuthorityLevel,
                requiredAuthorityLevel
            )
        )
            revert IPause.InsufficientAuthorityLevel(
                senderAuthorityLevel,
                requiredAuthorityLevel
            );
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

    // THIS METHOD MUST BE EXTENDED WITH THE ACTUAL LOGIC DETERMINING THE AUTHORITY LEVEL OF AN ACCOUNT
    function _getAuthorityLevel(
        address _account
    ) internal view virtual returns (uint256);

    function _compareAuthorityLevels(
        uint256 _newLevel,
        uint256 _previousLevel
    ) internal pure returns (bool) {
        if (_newLevel < _previousLevel) return false;
        return true;
    }
}
