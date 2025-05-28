// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {_PAUSE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {Common} from '../core/Common.sol';
import {IPause} from './IPause.sol';

contract PauseInternal is Common {
    struct PauseStorage {
        bool pause;
        uint256 authorityLevel;
    }

    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    modifier whenPaused() {
        _requirePaused();
        _;
    }

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

    function _paused() internal view virtual returns (bool) {
        return _pauseStorage().pause;
    }

    function _requireNotPaused() internal view virtual {
        if (_paused()) revert IPause.IsPaused();
    }

    function _requirePaused() internal view virtual {
        if (!_paused()) revert IPause.IsNotPaused();
    }

    // THIS METHOD MUST BE EXTENDED WITH THE ACTUAL LOGIC DETERMINING THE AUTHORITY LEVEL OF AN ACCOUNT
    function _getAuthorityLevel(
        address _account
    ) internal view virtual returns (uint256) {
        _addressIsNotZero(_account);
        return 0;
    }

    function _compareAuthorityLevels(
        uint256 _newLevel,
        uint256 _previousLevel
    ) internal pure returns (bool) {
        if (_newLevel < _previousLevel) return false;
        return true;
    }

    function _pauseStorage()
        internal
        pure
        returns (PauseStorage storage pauseStorage_)
    {
        bytes32 position = _PAUSE_STORAGE_POSITION;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            pauseStorage_.slot := position
        }
    }
}
