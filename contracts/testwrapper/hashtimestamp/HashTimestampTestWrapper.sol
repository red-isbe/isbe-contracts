// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {HashTimestampFacet} from '../../hashtimestamp/HashTimestampFacet.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {MockTimestamp} from '../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

/// @title HashTimestampTestWrapper
/// @notice Implements timestamp for hashes (only for test)
/// @dev Inherits from HashTimestamp, providing access to block timestamp functions
contract HashTimestampTestWrapper is HashTimestampFacet, MockTimestamp {
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256)
    {
        return MockTimestamp._blockTimestamp();
    }
}
