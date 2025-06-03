// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {_ASSET_EVENT_TRACKER_ROLE} from '../constants/roles.sol';
import {AssetEventTracker} from './AssetEventTracker.sol';

/// @title AssetEventTracker
/// @notice Implements generic state tracking for an asset using events
abstract contract IsbeAssetEventTracker is AssetEventTracker {
    function recordState(
        uint256 newState
    ) external override whenNotPaused onlyRole(_ASSET_EVENT_TRACKER_ROLE) {
        _recordState(newState);
    }
}
