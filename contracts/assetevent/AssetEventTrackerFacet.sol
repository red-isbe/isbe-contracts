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

import {_ASSET_EVENT_TRACKER_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {AssetEventTracker} from './AssetEventTracker.sol';
import {IEIP2535Introspection} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title AssetEventTrackerFacet
/// @notice Implements generic state tracking for an asset using events
/// @dev Inherits from AssetEventTracker, providing asset event tracker functions
/// @author ISBE Development Team
abstract contract AssetEventTrackerFacet is
    AssetEventTracker,
    IEIP2535Introspection
{
    /// @notice Get the list of interfaces implemented by this facet
    /// @return interfaces_ Array of interface IDs
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /// @notice Get the business ID associated with this facet
    /// @return businessId_ Business ID for this facet
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ASSET_EVENT_TRACKER_RESOLVER_KEY;
    }

    /// @notice Get the list of function selectors for this facet
    /// @return selectors_ Array of function selectors
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 5;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.recordState.selector;
        selectors_[--selectorsLength] = this.getAssetEvents.selector;
        selectors_[--selectorsLength] = this.getLatestAssetEvent.selector;
        selectors_[--selectorsLength] = this.getCurrentState.selector;
        selectors_[--selectorsLength] = this.isStateChangeAllowed.selector;
    }
}
