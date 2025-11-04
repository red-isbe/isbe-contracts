// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {TimeStampingRegistryFacet} from '../../client/tsr/TimeStampingRegistryFacet.sol';
import {MockTimestamp} from '../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';

/// @title TimeStampingRegistryTestWrapper
/// @notice Test wrapper for TimeStampingRegistry providing timestamp control for testing
/// @dev Extends MockTimestamp for deterministic testing of time-dependent functionality
/// @author ISBE Team
/// @custom:security-level 0 (Test only)
/// @custom:auditor ISBE Security Team
contract TimeStampingRegistryTestWrapper is
    TimeStampingRegistryFacet,
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
