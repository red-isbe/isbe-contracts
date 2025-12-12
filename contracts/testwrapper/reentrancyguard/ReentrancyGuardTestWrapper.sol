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

import {ReentrancyGuard} from '../../security/ReentrancyGuard.sol';

/// @title ReentrancyGuardTestWrapper
/// @notice Implements ReentrancyGuard (only for test)
/// @dev Inherits from ReentrancyGuard, simulates reentrant calls
contract ReentrancyGuardTestWrapper is ReentrancyGuard {
    bytes32 public usedKey;
    event ProtectedCalled(bytes32 key);

    function callProtected(bytes32 _key) public nonReentrant(_key) {
        usedKey = _key;
        emit ProtectedCalled(_key);
    }

    function forceReentrantFail(bytes32 _key) public nonReentrant(_key) {
        this.callProtected(_key);
    }
}
