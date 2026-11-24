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
 * @title PauseIgnoredMock
 * @author ISBE
 * @notice Contract that answers `pause()`, `unpause()` and `paused()` correctly
 *         but never changes its state.
 * @dev Covers the `PauseNotEffective` branch of `GlobalIsbePauseInternal`.
 *      Unlike `FallbackSilentMock`, this one does implement the three functions,
 *      so the call succeeds and `paused()` returns a well-formed ABI word: the
 *      state read-back is the only thing that catches it.
 *
 *      `reported_` fixes what `paused()` always answers, which selects the case
 *      under test: deploy with `false` to break `pauseIsbe`, with `true` to
 *      break `unpauseIsbe`.
 */
contract PauseIgnoredMock {
    // solhint-disable-next-line immutable-vars-naming
    bool private immutable _reported;

    constructor(bool reported_) {
        _reported = reported_;
    }

    // solhint-disable-next-line no-empty-blocks
    function pause() external {
        // Accepted and ignored on purpose.
    }

    // solhint-disable-next-line no-empty-blocks
    function unpause() external {
        // Accepted and ignored on purpose.
    }

    function paused() external view returns (bool) {
        return _reported;
    }
}
