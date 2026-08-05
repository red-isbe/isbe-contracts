// SPDX-License-Identifier: Apache-2.0

/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
pragma solidity ^0.8.28;

import {IKnownDidTestWrapper} from './IKnownDidTestWrapper.sol';
import {ISBEContext} from '../../utils/ISBEContext.sol';
import {
    DidDocumentDetailedInternal
} from '../../identity/didregistry/DidDocumentDetailedInternal.sol';

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
