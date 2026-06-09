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
 * @title FallbackRevertMock
 * @author ISBE
 * @notice Contract with a reverting fallback that returns non-empty error data.
 * @dev Used to test the `returnData.length > 0 && !_isProxyDeployed` branch in
 *      `GlobalIsbePauseInternal._tryPause` / `_tryUnpause`.
 *      Unlike `NoPauseMock` (which produces empty returnData via the implicit
 *      selector-not-found revert), this contract's fallback always returns
 *      non-empty data — ensuring the second condition of the guard
 *      (`!_isProxyDeployed`) is what drives the `InvalidProxy` revert.
 */
contract FallbackRevertMock {
    error FallbackReverted();

    fallback() external payable {
        revert FallbackReverted();
    }
}
