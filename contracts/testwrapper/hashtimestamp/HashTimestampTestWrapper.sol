// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {HashTimestamp} from '../../hashtimestamp/HashTimestamp.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title HashTimestampTestWrapper
/// @notice Implements timestamp for hashes (only for test)
/// @dev Inherits from HashTimestamp, providing access to block timestamp functions
contract HashTimestampTestWrapper is HashTimestamp, IEIP2535Introspection {
    uint256 private _mockedTimestamp;

    function setMockedTimestamp(uint256 ts) external {
        _mockedTimestamp = ts;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.timestampHash.selector;
        selectors_[--selectorsLength] = this.exists.selector;
        selectors_[--selectorsLength] = this.getTimestamp.selector;
        selectors_[--selectorsLength] = this.setMockedTimestamp.selector;
    }

    function _blockTimestamp() internal view override returns (uint256) {
        return
            _mockedTimestamp == 0 ? super._blockTimestamp() : _mockedTimestamp;
    }
}
