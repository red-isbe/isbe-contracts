// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AssetEventTracker} from '../../assetevent/AssetEventTracker.sol';
import {AccessControl} from '../../access/accessControl/AccessControl.sol';
import {ISBEPause} from '../../pause/ISBEPause.sol';

/// @title AssetEventTrackerTestWrapper
/// @notice Implements asset event tracker (only for test)
/// @dev Inherits from AssetEventTracker, providing access to block timestamp and check state change functions
contract AssetEventTrackerTestWrapper is
    AssetEventTracker,
    AccessControl,
    ISBEPause
{
    uint256 private _mockedTimestamp;

    function setMockedTimestamp(uint256 ts) external {
        _mockedTimestamp = ts;
    }

    function selectorsIntrospection()
        external
        pure
        override(AccessControl, ISBEPause)
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 6;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.recordState.selector;
        selectors_[--selectorsLength] = this.getAssetEvents.selector;
        selectors_[--selectorsLength] = this.getLatestAssetEvent.selector;
        selectors_[--selectorsLength] = this.getCurrentState.selector;
        selectors_[--selectorsLength] = this.isStateChangeAllowed.selector;
        selectors_[--selectorsLength] = this.setMockedTimestamp.selector;
    }

    function _blockTimestamp() internal view override returns (uint256) {
        return
            _mockedTimestamp == 0 ? super._blockTimestamp() : _mockedTimestamp;
    }

    function _isStateChangeAllowed(
        uint256 currentState,
        uint256 newState
    ) internal pure override returns (bool) {
        return currentState < newState;
    }
}
