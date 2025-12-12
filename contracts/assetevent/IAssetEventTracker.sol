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

/// @title IAssetEventTracker
/// @notice Interface to track asset events
/// @author ISBE Development Team
interface IAssetEventTracker {
    struct AssetEvent {
        uint256 state;
        uint256 timestamp;
    }

    /// @notice Emitted when a state is recorded
    /// @param state The state that was recorded
    /// @param timestamp The block timestamp when the state was recorded
    /// @param sender The address that submitted the state to be recorded
    event StateRecorded(
        uint256 indexed state,
        uint256 indexed timestamp,
        address indexed sender
    );

    error StateChangeNotAllowed(uint256 newState);

    /// @notice Register new asset event
    /// @param _newState New asset state for this event
    function recordState(uint256 _newState) external;

    /// @notice Return paginated events based on page number and results per page
    /// @param _pageNumber Page number (starting with 0)
    /// @param _resultsPerPage Number of results per page
    /// @return assetEvents_ Asset events array
    function getAssetEvents(
        uint256 _pageNumber,
        uint256 _resultsPerPage
    ) external view returns (AssetEvent[] memory assetEvents_);

    /// @notice Return latest asset event
    /// @return Latest asset event registered
    function getLatestAssetEvent() external view returns (AssetEvent memory);

    /// @notice Return current state
    /// @return Latest state registered
    function getCurrentState() external view returns (uint256);

    /// @notice Return if state change is allowed
    /// @param _newState New asset state to change
    /// @return True or false if is allowed
    function isStateChangeAllowed(
        uint256 _newState
    ) external view returns (bool);
}
