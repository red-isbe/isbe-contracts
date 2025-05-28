// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {_PAUSE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {IPause} from './IPause.sol';

abstract contract PauseInternalCommon {
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

    function _paused() internal view virtual returns (bool) {
        return _pauseStorage().pause;
    }

    function _requireNotPaused() internal view virtual {
        if (_paused()) revert IPause.IsPaused();
    }

    function _requirePaused() internal view virtual {
        if (!_paused()) revert IPause.IsNotPaused();
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
