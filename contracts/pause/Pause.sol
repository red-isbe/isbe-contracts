// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import {PauseInternal} from './PauseInternal.sol';
import {IPause} from './IPause.sol';
import {_PAUSE_RESOLVER_KEY} from '../constants/resolverKeys.sol';

/// @title Pause
/// @notice Implements pausing mechanism
/// @dev Inherits from IPause and PauseInternal, providing external pause functions
abstract contract Pause is IPause, PauseInternal {
    /// @notice Constructor that disables the initializer
    constructor() {
        _disableInitializers(_PAUSE_RESOLVER_KEY);
    }

    function initializePause(
        bool _paused
    ) external virtual initializer(_PAUSE_RESOLVER_KEY) {
        if (_paused) _pause();
        else _unpause();
    }

    function pause() external virtual whenNotPaused {
        _checkPauserRoles();

        _pause();
        emit Paused(_msgSender());
    }

    function unpause() external virtual whenPaused checkAuthorityLevel {
        _checkPauserRoles();

        _unpause();
        emit Unpaused(_msgSender());
    }

    function paused() external view virtual returns (bool) {
        return _paused();
    }

    function authorityLevel() external view virtual returns (uint256) {
        return _authorityLevel();
    }

    /// @notice Ensures the calling account has at least one of the required pauser roles
    /// @dev This function must be overridden in derived contracts to provide the actual logic
    ///      checking the caller's roles
    function _checkPauserRoles() internal view virtual;
}
