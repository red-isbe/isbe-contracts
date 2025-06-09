// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MockTimestamp} from './MockTimestamp.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

contract MockTimestampFacet is IEIP2535Introspection, MockTimestamp {
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.setMockedTimestamp.selector;
    }
}
