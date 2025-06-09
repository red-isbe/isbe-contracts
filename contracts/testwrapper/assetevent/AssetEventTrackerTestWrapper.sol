// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {
    AssetEventTrackerFacet
} from '../../assetevent/AssetEventTrackerFacet.sol';
import {MockTimestamp} from '../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

/// @title AssetEventTrackerTestWrapper
/// @notice Implements asset event tracker (only for test)
/// @dev Inherits from AssetEventTracker, providing access to block timestamp and check state change functions
contract AssetEventTrackerTestWrapper is AssetEventTrackerFacet, MockTimestamp {
    function _isStateChangeAllowed(
        uint256 currentState,
        uint256 newState
    ) internal pure override returns (bool) {
        return currentState < newState;
    }

    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256)
    {
        return MockTimestamp._blockTimestamp();
    }
}
