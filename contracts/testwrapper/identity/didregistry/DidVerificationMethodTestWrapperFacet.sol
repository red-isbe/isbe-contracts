// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidVerificationMethodFacet} from '../../../identity/didregistry/DidVerificationMethodFacet.sol';
import {MockTimestamp} from '../../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../../utils/ISBEContext.sol';

contract DidVerificationMethodTestWrapperFacet is
    DidVerificationMethodFacet,
    MockTimestamp
{
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256)
    {
        return MockTimestamp._blockTimestamp();
    }
}
