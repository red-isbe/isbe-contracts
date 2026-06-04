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

import {IPause} from '../../pause/IPause.sol';

/**
 * @title Mod2PausableMock
 * @author ISBE
 * @notice Minimal ISBEPause-compatible standalone contract for modality-2 testing.
 * @dev Simulates a contract deployed outside the proxy factory that still implements
 *      the `pause()` / `unpause()` interface required by `GlobalIsbePause`.
 *      Only `authorizedPauser` (i.e. the governance diamond address in tests) may
 *      call `pause` or `unpause`; all other callers receive `NotAuthorized`.
 */
contract Mod2PausableMock {
    /// @notice Thrown when an unauthorised account tries to pause or unpause.
    error NotAuthorized(address caller, address expected);

    bool private _paused;
    address private immutable _authorizedPauser;

    constructor(address authorizedPauser_) {
        _authorizedPauser = authorizedPauser_;
    }

    function pause() external {
        if (msg.sender != _authorizedPauser)
            revert NotAuthorized(msg.sender, _authorizedPauser);
        if (_paused) revert IPause.IsPaused();
        _paused = true;
    }

    function unpause() external {
        if (msg.sender != _authorizedPauser)
            revert NotAuthorized(msg.sender, _authorizedPauser);
        if (!_paused) revert IPause.IsNotPaused();
        _paused = false;
    }

    function paused() external view returns (bool) {
        return _paused;
    }
}
