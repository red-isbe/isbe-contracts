// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidVerificationRelationshipFacet} from '../../../identity/didregistry/DidVerificationRelationshipFacet.sol';
import {MockTimestamp} from '../../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../../utils/ISBEContext.sol';

contract DidVerificationRelationshipTestWrapperFacet is
    DidVerificationRelationshipFacet,
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
