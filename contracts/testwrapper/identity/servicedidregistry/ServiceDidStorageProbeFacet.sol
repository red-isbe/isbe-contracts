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
    ServiceDidRegistryInternal
} from '../../../identity/servicedidregistry/ServiceDidRegistryInternal.sol';

/**
 * @title Service DID Registry Storage Probe Facet
 * @notice Writes directly into the registry's namespaced slot to reach states the
 *         external surface cannot produce
 * @dev The registry guards its identifier derivation with a defensive
 *      `ServiceDidAlreadyExists`. A monotonic nonce makes that condition unreachable
 *      through normal operation, which is exactly why it is worth keeping and exactly
 *      why no ordinary test can exercise it. This probe forges the collision so the
 *      guard is proven to hold rather than merely assumed.
 *
 *      Kept apart from `ServiceDidRegistryTestWrapperFacet` on purpose: that wrapper
 *      must stay a faithful mirror of the production facet, differing only in its clock.
 *      Testing environments only; never cut into a real diamond.
 * @author ISBE Development Team
 */
contract ServiceDidStorageProbeFacet is ServiceDidRegistryInternal {
    /// @notice Marks an identifier as already registered, without any other state
    /// @param _serviceDid The identifier to forge
    function forceServiceDidExists(bytes32 _serviceDid) external {
        _serviceDidRegistryStorage().records[_serviceDid].exists = true;
    }

    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](0);
    }
}
