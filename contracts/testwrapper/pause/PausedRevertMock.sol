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

/**
 * @title PausedRevertMock
 * @author ISBE
 * @notice Contract that accepts `pause()` / `unpause()` but whose `paused()` reverts.
 * @dev Covers the `!success` operand of the state read-back guard in
 *      `GlobalIsbePauseInternal._assertPauseState`.
 *
 *      The other mocks cover the rest of that guard: `FallbackSilentMock` makes
 *      `paused()` answer with empty data (`returnData.length != 32`) and
 *      `PauseIgnoredMock` answers correctly without changing state. Here the
 *      read itself fails, which is what a contract exposing `pause()` without a
 *      real pause state looks like from the governance side.
 */
contract PausedRevertMock {
    error PausedUnavailable();

    // solhint-disable-next-line no-empty-blocks
    function pause() external {
        // Accepted so that the failure surfaces on the read-back, not here.
    }

    // solhint-disable-next-line no-empty-blocks
    function unpause() external {
        // Accepted so that the failure surfaces on the read-back, not here.
    }

    function paused() external pure returns (bool) {
        revert PausedUnavailable();
    }
}
