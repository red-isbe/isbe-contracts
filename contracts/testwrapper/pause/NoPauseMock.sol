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
 * @title NoPauseMock
 * @author ISBE
 * @notice Empty contract with no `pause()` or `unpause()` functions.
 * @dev Used to test the `returnData.length == 0` branch in `GlobalIsbePauseInternal`:
 *      calling an undefined selector on a contract with no fallback causes the EVM
 *      to revert with empty return data, which `_tryPause`/`_tryUnpause` maps to
 *      `InvalidProxy`.
 */
// solhint-disable-next-line no-empty-blocks
contract NoPauseMock {
    // Intentionally empty — no pause/unpause functions to trigger empty-returnData revert
}
