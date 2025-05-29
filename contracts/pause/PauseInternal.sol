// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {_PAUSE_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {Common} from '../core/Common.sol';
import {IPause} from './IPause.sol';

/// @title PauseInternal
/// @notice Internal logic for pausing mechanism
abstract contract PauseInternal is Common {
    /// @notice Modifier to restrict function to accounts with an authority level high enough
    /// @dev Reverts with `InsufficientAuthorityLevel` error if the authority level is not high enough
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

    /// @notice Retrieves the authority level of a specific account
    /// @dev This function must be overridden in derived contracts to provide the actual logic
    ///      for determining an account's authority level
    /// @param _account The address of the account whose authority level is being queried
    /// @return The authority level of the given account
    function _getAuthorityLevel(
        address _account
    ) internal view virtual returns (uint256);

    function _compareAuthorityLevels(
        uint256 _newLevel,
        uint256 _previousLevel
    ) internal pure virtual returns (bool) {
        if (_newLevel < _previousLevel) return false;
        return true;
    }
}
