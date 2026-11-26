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
 * @title PausedNonBooleanMock
 * @author ISBE
 * @notice Contract whose `paused()` returns a word that is not a canonical bool.
 * @dev Covers the `rawState > 1` guard in
 *      `GlobalIsbePauseInternal._assertPauseState`.
 *
 *      `IPause.paused()` is declared as returning a `bool`, so the only valid
 *      words are 0 and 1. A contract that answers with anything else is not
 *      implementing the interface, and its state cannot be trusted in either
 *      direction — governance must not read "non-zero" as "paused".
 *
 *      Solidity will not let a `bool` return a value outside {0, 1}, so the
 *      word is written directly in assembly, the same way a hand-written or
 *      malicious contract would do it.
 */
contract PausedNonBooleanMock {
    // solhint-disable-next-line no-empty-blocks
    function pause() external {
        // Accepted so that the failure surfaces on the read-back.
    }

    // solhint-disable-next-line no-empty-blocks
    function unpause() external {
        // Accepted so that the failure surfaces on the read-back.
    }

    /// @notice Returns the word 2, which is 32 bytes long but not a valid bool.
    function paused() external pure returns (bool) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            mstore(0x00, 2)
            return(0x00, 0x20)
        }
    }
}
