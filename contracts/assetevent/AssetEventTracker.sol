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

import {IAssetEventTracker} from './IAssetEventTracker.sol';
import {AssetEventTrackerInternal} from './AssetEventTrackerInternal.sol';
import {_ASSET_EVENT_TRACKER_ROLE} from '../constants/roles.sol';

/// @title AssetEventTracker
/// @notice Implements generic state tracking for an asset using events
/// @author ISBE Development Team
abstract contract AssetEventTracker is
    IAssetEventTracker,
    AssetEventTrackerInternal
{
    /// @notice Record a new state for the asset
    /// @param _newState The new state to record
    function recordState(
        uint256 _newState
    )
        external
        override
        onlyAllowedStateChange(_newState)
        whenNotPaused
        onlyRole(_ASSET_EVENT_TRACKER_ROLE)
    {
        _recordState(_newState);
    }

    /// @notice Get paginated list of asset events
    /// @param _pageNumber The page number to fetch (0-based)
    /// @param _resultsPerPage Number of results per page
    /// @return assetEvents_ Array of asset events for the requested page
    function getAssetEvents(
        uint256 _pageNumber,
        uint256 _resultsPerPage
    ) external view override returns (AssetEvent[] memory assetEvents_) {
        return _getAssetEvents(_pageNumber, _resultsPerPage);
    }

    /// @notice Get the most recent asset event
    /// @return Latest recorded asset event
    function getLatestAssetEvent()
        external
        view
        override
        returns (AssetEvent memory)
    {
        return _getLatestAssetEvent();
    }

    /// @notice Get the current state of the asset
    /// @return Current state value
    function getCurrentState() external view override returns (uint256) {
        return _getCurrentState();
    }

    /// @notice Check if transitioning to a new state is allowed
    /// @param _newState The state to check
    /// @return Whether the state change is allowed
    function isStateChangeAllowed(
        uint256 _newState
    ) external view returns (bool) {
        return _isStateChangeAllowed(_getCurrentState(), _newState);
    }

    /// @notice Get the list of implemented interfaces
    /// @return interfaces_ Array of interface IDs
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
