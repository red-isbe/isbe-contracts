// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAssetEventTracker} from './IAssetEventTracker.sol';
import {AssetEventTrackerInternal} from './AssetEventTrackerInternal.sol';
import {_ASSET_EVENT_TRACKER_ROLE} from '../constants/roles.sol';
import {ERC165} from '../core/ERC165.sol';

/// @title AssetEventTracker
/// @notice Implements generic state tracking for an asset using events
abstract contract AssetEventTracker is
    IAssetEventTracker,
    ERC165,
    AssetEventTrackerInternal
{
    function recordState(
        uint256 newState
    )
        external
        override
        onlyAllowedStateChange(newState)
        whenNotPaused
        onlyRole(_ASSET_EVENT_TRACKER_ROLE)
    {
        _recordState(newState);
    }

    function getAssetEvents(
        uint256 pageNumber,
        uint256 resultsPerPage
    ) external view override returns (AssetEvent[] memory assetEvents) {
        return _getAssetEvents(pageNumber, resultsPerPage);
    }

    function getLatestAssetEvent()
        external
        view
        override
        returns (AssetEvent memory)
    {
        return _getLatestAssetEvent();
    }

    function getCurrentState() external view override returns (uint256) {
        return _getCurrentState();
    }

    function isStateChangeAllowed(
        uint256 newState
    ) external view returns (bool) {
        return _isStateChangeAllowed(_getCurrentState(), newState);
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IAssetEventTracker).interfaceId;
    }
}
