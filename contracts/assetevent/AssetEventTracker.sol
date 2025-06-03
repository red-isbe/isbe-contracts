// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAssetEventTracker} from './IAssetEventTracker.sol';
import {AssetEventTrackerInternal} from './AssetEventTrackerInternal.sol';

/// @title AssetEventTracker
/// @notice Implements generic state tracking for an asset using events
abstract contract AssetEventTracker is
    IAssetEventTracker,
    AssetEventTrackerInternal
{
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
}
