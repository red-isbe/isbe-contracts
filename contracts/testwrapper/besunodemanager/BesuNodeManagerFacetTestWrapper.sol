// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {BesuNodeManagerFacet} from '../../client/besuNodeManager/BesuNodeManagerFacet.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {MockTimestamp} from '../mockTimestamp/MockTimestamp.sol';

contract BesuNodeManagerFacetTestWrapper is
    BesuNodeManagerFacet,
    MockTimestamp
{
    /// @notice Override block timestamp to use mock timestamp
    /// @dev Returns the mock timestamp instead of the actual block timestamp
    /// @return timestamp_ The mock timestamp set for testing
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256 timestamp_)
    {
        return MockTimestamp._blockTimestamp();
    }
}
