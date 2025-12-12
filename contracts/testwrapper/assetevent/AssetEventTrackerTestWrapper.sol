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

import {AssetEventTrackerFacet} from '../../assetevent/AssetEventTrackerFacet.sol';
import {MockTimestamp} from '../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

/// @title AssetEventTrackerTestWrapper
/// @notice Implements asset event tracker (only for test)
/// @dev Inherits from AssetEventTracker, providing access to block timestamp and check state change functions
contract AssetEventTrackerTestWrapper is AssetEventTrackerFacet, MockTimestamp {
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256)
    {
        return MockTimestamp._blockTimestamp();
    }

    function _isStateChangeAllowed(
        uint256 _currentState,
        uint256 _newState
    ) internal pure override returns (bool) {
        return _currentState < _newState;
    }
}
