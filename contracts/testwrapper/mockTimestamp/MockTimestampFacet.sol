// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {MockTimestamp} from './MockTimestamp.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {IMockTimestamp} from './IMockTimestamp.sol';

contract MockTimestampFacet is IEIP2535Introspection, MockTimestamp {
    // keccak256('isbe.contracts.mock.timestamp.resolver.key');
    bytes32 private constant _MOCK_TIMESTAMP_RESOLVER_KEY =
        0xfa3c45d4727a5270f2c6166509595a392f4cabdf459fab1b34ccfab634b56777;

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IMockTimestamp).interfaceId;
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _MOCK_TIMESTAMP_RESOLVER_KEY;
    }

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
