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

import {
    ServiceDidRegistryFacet
} from '../../../identity/servicedidregistry/ServiceDidRegistryFacet.sol';
import {MockTimestamp} from '../../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../../utils/ISBEContext.sol';

/**
 * @title Service DID Registry Test Wrapper Facet
 * @notice Test wrapper combining the service DID registry with controllable timestamp
 *         behaviour
 * @dev Mirrors the wrappers of the organisational registry. The controllable clock is
 *      what makes expiry reachable in tests: `isServiceDidActive` compares against the
 *      block timestamp, and without moving it there is no way to observe an identity
 *      crossing its own expiry. Timestamp state is shared with `MockTimestampFacet`
 *      through the diamond, so a single `setMockedTimestamp` moves the clock for every
 *      wrapper cut into it. Designed exclusively for testing environments
 * @author ISBE Development Team
 */
contract ServiceDidRegistryTestWrapperFacet is
    ServiceDidRegistryFacet,
    MockTimestamp
{
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256)
    {
        return MockTimestamp._blockTimestamp();
    }
}
