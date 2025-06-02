// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {HashTimestamp} from '../../hashtimestamp/HashTimestamp.sol';
import {AccessControl} from '../../access/AccessControl.sol';
import {ISBEPause} from '../../pause/ISBEPause.sol';

/// @title HashTimestampTestWrapper
/// @notice Implements timestamp for hashes (only for test)
/// @dev Inherits from HashTimestamp, providing access to block timestamp functions
contract HashTimestampTestWrapper is HashTimestamp, AccessControl, ISBEPause {
    uint256 private _mockedTimestamp;

    function setMockedTimestamp(uint256 ts) external {
        _mockedTimestamp = ts;
    }

    function _blockTimestamp() internal view override returns (uint256) {
        return
            _mockedTimestamp == 0 ? super._blockTimestamp() : _mockedTimestamp;
    }
}
