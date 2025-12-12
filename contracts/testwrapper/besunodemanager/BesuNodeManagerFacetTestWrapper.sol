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

import {BesuNodeManagerFacet} from '../../client/besuNodeManager/BesuNodeManagerFacet.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {MockTimestamp} from '../mockTimestamp/MockTimestamp.sol';

contract BesuNodeManagerFacetTestWrapper is
    BesuNodeManagerFacet,
    MockTimestamp
{
    /// @notice Override block timestamp to use mock timestamp
    /// @dev Returns the mock timestamp instead of the actual block timestamp
    /// @return timestamp_ The mock timestamp set for testing
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256 timestamp_)
    {
        return MockTimestamp._blockTimestamp();
    }
}
