// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {HashTimestamp} from './HashTimestamp.sol';
import {
    IEIP2535Introspection
} from '../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title HashTimestampFacet
/// @notice Implements timestamp for hashes facet
/// @dev Inherits from HashTimestamp, providing external timestamp hashes functions
contract HashTimestampFacet is HashTimestamp, IEIP2535Introspection {
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.timestampHash.selector;
        selectors_[--selectorsLength] = this.exists.selector;
        selectors_[--selectorsLength] = this.getTimestamp.selector;
    }
}
