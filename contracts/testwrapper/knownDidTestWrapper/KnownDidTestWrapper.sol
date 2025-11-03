// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IKnownDidTestWrapper} from './IKnownDidTestWrapper.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {DidDocumentDetailedInternal} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';

/**
 * @title KnownDidTestWrapper
 * @notice Test wrapper contract for testing the onlyKnownDid modifier
 * @dev This contract is used to test DID registration validation in the DID registry
 */
contract KnownDidTestWrapper is
    IKnownDidTestWrapper,
    ISBEContext,
    DidDocumentDetailedInternal
{
    /**
     * @notice Tests the onlyKnownDid modifier by checking if the caller has a registered DID
     * @dev Emits DidVerified event if the caller has a valid DID, otherwise reverts with AddressNotKnown
     */
    function testOnlyKnownDid() external onlyKnownDid(_msgSender()) {
        emit DidVerified(_msgSender());
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](0);
    }
}
