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

import {KnownDidTestWrapper} from './KnownDidTestWrapper.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {IKnownDidTestWrapper} from './IKnownDidTestWrapper.sol';

/**
 * @title KnownDidTestWrapperFacet
 * @notice Facet version of KnownDidTestWrapper for Diamond pattern integration
 * @dev Adds business ID introspection capability to the KnownDidTestWrapper
 */
contract KnownDidTestWrapperFacet is
    IEIP2535Introspection,
    KnownDidTestWrapper
{
    // keccak256('isbe.contracts.known.did.test.wrapper.resolver.key');
    bytes32 private constant _KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY =
        0x58bd9b230b3728f8f3e2a338cc2656a4e2906aa53ff7b53e4c7d96e7afacd23a;

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IKnownDidTestWrapper)
            .interfaceId;
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _KNOWN_DID_TEST_WRAPPER_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.testOnlyKnownDid.selector;
    }
}
