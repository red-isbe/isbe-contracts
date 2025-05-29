// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title IAssetEventTracker
/// @notice Interface to track asset events
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
        uint256 state,
        uint256 timestamp,
        address indexed sender
    );

    error StateChangeNotAllowed(uint256 newState);

    /// @notice Register new asset event
    /// @param newState New asset state for this event
    function recordState(uint256 newState) external;

    /// @notice Return paginated events based on page number and results per page
    /// @param pageNumber Page number (starting with 0)
    /// @param resultsPerPage Number of results per page
    /// @return assetEvents Asset events array
    function getAssetEvents(
        uint256 pageNumber,
        uint256 resultsPerPage
    ) external view returns (AssetEvent[] memory assetEvents);

    /// @notice Return latest asset event
    /// @return Latest asset event registered
    function getLatestAssetEvent() external view returns (AssetEvent memory);

    /// @notice Return current state
    /// @return Latest state registered
    function getCurrentState() external view returns (uint256);

    /// @notice Return if state change is allowed
    /// @param newState New asset state to change
    /// @return True or false if is allowed
    function isStateChangeAllowed(
        uint256 newState
    ) external view returns (bool);
}
