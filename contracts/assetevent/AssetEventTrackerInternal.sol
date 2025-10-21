// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ASSET_EVENT_TRACKER_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {Common} from '../core/Common.sol';
import {LibCommon} from '../core/LibCommon.sol';
import {IAssetEventTracker} from './IAssetEventTracker.sol';

/// @title AssetEventTrackerInternal
/// @notice Implements generic state tracking for an asset using events
/// @author ISBE Development Team
abstract contract AssetEventTrackerInternal is Common {
    /// @notice Struct storing all asset events
    struct AssetEventTrackerStorage {
        IAssetEventTracker.AssetEvent[] assetEvents;
    }

    /// @notice Modifier to validate state change is allowed
    /// @param _newState The new state to check
    modifier onlyAllowedStateChange(uint256 _newState) {
        _checkStateChange(_newState);
        _;
    }

    /// @notice Record a new state in storage and emit an event
    /// @param _newState The new state to be recorded
    function _recordState(uint256 _newState) internal virtual {
        uint256 timestamp = _blockTimestamp();
        _assetEventTrackerStorage().assetEvents.push(
            IAssetEventTracker.AssetEvent({
                state: _newState,
                timestamp: timestamp
            })
        );
        emit IAssetEventTracker.StateRecorded(_newState, timestamp, msg.sender);
    }

    /// @notice Get a paginated slice of asset events
    /// @param _pageNumber Page number (0-based)
    /// @param _resultsPerPage Number of results per page
    /// @return assetEvents_ Slice of events for the requested page
    function _getAssetEvents(
        uint256 _pageNumber,
        uint256 _resultsPerPage
    )
        internal
        view
        virtual
        returns (IAssetEventTracker.AssetEvent[] memory assetEvents_)
    {
        (uint256 start, uint256 end) = LibCommon.getStartAndEnd(
            _pageNumber,
            _resultsPerPage
        );
        uint256 resultLength = LibCommon.getSize(
            start,
            end,
            _assetEventTrackerStorage().assetEvents.length
        );

        assetEvents_ = new IAssetEventTracker.AssetEvent[](resultLength);
        for (uint256 i; i < resultLength; ) {
            assetEvents_[i] = _getAssetEventByIndex(start);
            unchecked {
                ++i;
                ++start;
            }
        }
    }

    /// @notice Get the latest stored asset event
    /// @return assetEvent_ Latest event or default if none
    function _getLatestAssetEvent()
        internal
        view
        virtual
        returns (IAssetEventTracker.AssetEvent memory assetEvent_)
    {
        uint256 assetEventsLength = _assetEventTrackerStorage()
            .assetEvents
            .length;
        assetEvent_ = assetEventsLength > 0
            ? _getAssetEventByIndex(assetEventsLength - 1)
            : assetEvent_;
    }

    /// @notice Get the current state from the latest event
    /// @return Current state value
    function _getCurrentState() internal view virtual returns (uint256) {
        return _getLatestAssetEvent().state;
    }

    /// @notice Returns an asset event by index
    /// @param _index The index to obtain
    /// @return assetEvent_ Asset event obtained
    function _getAssetEventByIndex(
        uint256 _index
    ) internal view returns (IAssetEventTracker.AssetEvent memory assetEvent_) {
        assetEvent_ = _assetEventTrackerStorage().assetEvents[_index];
    }

    /// @notice Check if state change is allowed
    /// @param _newState The new state to change
    function _checkStateChange(uint256 _newState) internal view virtual {
        require(
            _isStateChangeAllowed(_getCurrentState(), _newState),
            IAssetEventTracker.StateChangeNotAllowed(_newState)
        );
    }

    /// @notice Check if a state transition is allowed
    /// @param _currentState Current state
    /// @param _newState New state to validate
    /// @return Whether the state transition is allowed
    function _isStateChangeAllowed(
        uint256 _currentState,
        uint256 _newState
    ) internal pure virtual returns (bool);

    /// @notice Returns the storage slot for asset event tracker
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return storage_ The asset event tracker storage struct
    function _assetEventTrackerStorage()
        internal
        pure
        returns (AssetEventTrackerStorage storage storage_)
    {
        bytes32 position = _ASSET_EVENT_TRACKER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := position
        }
        // slither-disable-end assembly
    }
}
