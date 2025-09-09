// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ASSET_EVENT_TRACKER_RESOLVER_KEY} from '../constants/resolverKeys.sol';
import {AssetEventTracker} from './AssetEventTracker.sol';
import {IEIP2535Introspection} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title AssetEventTrackerFacet
/// @notice Implements generic state tracking for an asset using events
/// @dev Inherits from AssetEventTracker, providing asset event tracker functions
abstract contract AssetEventTrackerFacet is
    AssetEventTracker,
    IEIP2535Introspection
{
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ASSET_EVENT_TRACKER_RESOLVER_KEY;
    }

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
