// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import {_PAUSE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {IPause} from './IPause.sol';

abstract contract PauseInternalCommon {
    /// @notice Structure for storing pause state and authority level
    struct PauseStorage {
        bool pause;
        uint256 authorityLevel;
    }

    /// @notice Modifier to allow function execution only when the contract is not paused
    /// @dev Reverts with `IsPaused` error if the contract is currently paused
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /// @notice Modifier to allow function execution only when the contract is paused
    /// @dev Reverts with `IsNotPaused` error if the contract is not currently paused
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    function _paused() internal view virtual returns (bool) {
        return _pauseStorage().pause;
    }

    function _authorityLevel() internal view virtual returns (uint256) {
        return _pauseStorage().authorityLevel;
    }

    function _requireNotPaused() internal view virtual {
        require(!_paused(), IPause.IsPaused());
    }

    function _requirePaused() internal view virtual {
        require(_paused(), IPause.IsNotPaused());
    }

    /// @notice Returns the storage slot for pause
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return pauseStorage_ The pause storage struct
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
