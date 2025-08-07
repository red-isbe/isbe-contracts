// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DidControllerFacet} from '../../../identity/didregistry/DidControllerFacet.sol';
import {MockTimestamp} from '../../mockTimestamp/MockTimestamp.sol';
import {ISBEContext} from '../../../utils/ISBEContext.sol';

/**
 * @title Decentralised Identity Controller Test Wrapper Facet
 * @notice Test wrapper implementation combining DID controller functionality with controllable
 *         timestamp behaviour for comprehensive testing scenarios
 * @dev Test-specific facet that inherits from both DidControllerFacet and MockTimestamp
 *      to enable temporal testing of DID controller operations. Overrides timestamp behaviour
 *      to allow deterministic testing of time-sensitive verification relationships and
 *      document validity periods. Designed exclusively for testing environments
 * @author ISBE Development Team
 */
contract DidControllerTestWrapperFacet is DidControllerFacet, MockTimestamp {
    function _blockTimestamp()
        internal
        view
        override(ISBEContext, MockTimestamp)
        returns (uint256)
    {
        return MockTimestamp._blockTimestamp();
    }
}
