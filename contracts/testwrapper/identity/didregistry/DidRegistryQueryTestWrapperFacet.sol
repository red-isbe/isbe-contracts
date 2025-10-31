// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidRegistryQueryFacet} from '../../../identity/didregistry/facets/DidRegistryQueryFacet.sol';
import {MockTimestamp} from '../../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../../utils/ISBEContext.sol';

/**
 * @title DID Registry Query Test Wrapper Facet
 * @notice Test wrapper implementation combining DID registry query functionality with controllable
 *         timestamp behaviour for comprehensive testing scenarios
 * @dev Test-specific facet that inherits from both DidRegistryQueryFacet and MockTimestamp
 *      to enable temporal testing of DID query operations. Overrides timestamp behaviour
 *      to allow deterministic testing of time-sensitive queries and capability invocation checks.
 *      Designed exclusively for testing environments
 * @author ISBE Development Team
 */
contract DidRegistryQueryTestWrapperFacet is
    DidRegistryQueryFacet,
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
