// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {HashTimestamp} from '../../hashtimestamp/HashTimestamp.sol';

/// @title HashTimestampTestWrapper
/// @notice Implements timestamp for hashes (only for test)
/// @dev Inherits from HashTimestamp, providing access to block timestamp functions
contract HashTimestampTestWrapper is HashTimestamp {
    uint256 private _mockedTimestamp;

    function setMockedTimestamp(uint256 ts) external {
        _mockedTimestamp = ts;
    }

    function _blockTimestamp() internal view override returns (uint256) {
        return
            _mockedTimestamp == 0 ? super._blockTimestamp() : _mockedTimestamp;
    }
}
