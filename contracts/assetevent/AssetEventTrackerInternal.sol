// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ASSET_EVENT_TRACKER_STORAGE_POSITION} from '../constants/storagePositions.sol';
import {Common} from '../core/Common.sol';
import {IAssetEventTracker} from './IAssetEventTracker.sol';

/// @title AssetEventTrackerInternal
/// @notice Implements generic state tracking for an asset using events
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

    function _getAssetEvents(
        uint256 _pageNumber,
        uint256 _resultsPerPage
    )
        internal
        view
        virtual
        returns (IAssetEventTracker.AssetEvent[] memory assetEvents_)
    {
        uint256 start = _pageNumber * _resultsPerPage;
        uint256 totalEvents = _assetEventTrackerStorage().assetEvents.length;

        if (start >= totalEvents) {
            return assetEvents_;
        }

        uint256 end = start + _resultsPerPage;
        end = end > totalEvents ? totalEvents : end;

        uint256 resultLength = end - start;
        assetEvents_ = new IAssetEventTracker.AssetEvent[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            assetEvents_[i] = _getAssetEventByIndex(start + i);
        }
    }

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
