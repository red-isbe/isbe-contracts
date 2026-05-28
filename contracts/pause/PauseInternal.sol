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
/// @dev Aligned with OZ v5 Pausable: `_pause` and `_unpause` now emit the
///      events themselves so any internal caller (e.g. an emergency recovery
///      path in a subclass) always produces the corresponding log.
///      Initialization logic must use `_initPauseState` to set the initial
///      state without emitting events, mirroring OZ's upgradeable pattern.
abstract contract PauseInternal is Common {
    /**
     * @notice Sets the contract to paused state and records the authority level
     *         of the caller. Emits `Paused` (OZ v5 convention).
     * @dev Includes `whenNotPaused` following OZ v5.3 — the modifier on the
     *      internal function guards any subclass that calls `_pause()` directly,
     *      not only callers that go through the external `pause()` function.
     *      Do NOT call from initializers — use `_initPauseState` instead so
     *      no spurious `Paused` event is emitted at deployment time.
     */
    function _pause() internal virtual whenNotPaused {
        PauseStorage storage pauseStorage = _pauseStorage();
        pauseStorage.pause = true;
        pauseStorage.authorityLevel = _getAuthorityLevel(_msgSender());
        emit IPause.Paused(_msgSender());
    }

    /**
     * @notice Clears the paused state and resets the authority level.
     *         Emits `Unpaused` (OZ v5 convention).
     * @dev Includes `whenPaused` following OZ v5.3 — same rationale as `_pause`.
     *      Do NOT call from initializers — use `_initPauseState` instead.
     */
    function _unpause() internal virtual whenPaused {
        PauseStorage storage pauseStorage = _pauseStorage();
        pauseStorage.pause = false;
        pauseStorage.authorityLevel = 0;
        emit IPause.Unpaused(_msgSender());
    }

    /**
     * @notice Directly sets the initial pause state without emitting events.
     * @dev Mirrors OZ v5 `__Pausable_init_unchained`: initialization must not
     *      produce `Paused` / `Unpaused` logs. Call only from initializers.
     *      When `_initiallyPaused` is true, the authority level is seeded with
     *      the caller's level so that `unpause` authority checks behave
     *      consistently from the very first block.
     * @param _initiallyPaused Whether the contract should start in a paused state.
     */
    function _initPauseState(bool _initiallyPaused) internal {
        if (_initiallyPaused) {
            PauseStorage storage pauseStorage = _pauseStorage();
            pauseStorage.pause = true;
            pauseStorage.authorityLevel = _getAuthorityLevel(_msgSender());
        }
        // false → storage defaults to 0 / false, no action needed
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
