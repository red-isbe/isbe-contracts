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
 * @title FallbackSilentMock
 * @author ISBE
 * @notice Contract with a permissive fallback that accepts every call and does nothing.
 * @dev Reproduces the proxy family that defeated the previous governance check:
 *      it implements neither `pause()`, `unpause()` nor `paused()`, but its
 *      fallback swallows any selector and returns successfully with empty data.
 *      Under the old implementation `pauseIsbe` saw a non-reverting call, emitted
 *      `IsbePaused` and left the contract fully operational. `_assertPauseState`
 *      now rejects it: reading `paused()` back returns zero bytes instead of one
 *      ABI word, which raises `PauseStateUnverifiable`.
 *
 *      Note that `operate` keeps working while the contract is supposedly
 *      paused — that is exactly the behaviour being guarded against.
 */
contract FallbackSilentMock {
    uint256 public operations;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {
        // Present only so the payable fallback does not warn. Unused.
    }

    // solhint-disable-next-line no-empty-blocks
    fallback() external payable {
        // Accepts pause(), unpause(), paused() and anything else. Does nothing.
    }

    /// @notice A write that is never guarded by any pause state.
    function operate() external {
        ++operations;
    }
}
