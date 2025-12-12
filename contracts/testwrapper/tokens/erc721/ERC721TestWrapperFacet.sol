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

import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ERC721_TEST_WRAPPER_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {ERC721TestWrapper} from './ERC721TestWrapper.sol';

/**
 * @title ERC721TestWrapperFacet
 * @notice Facet exposing ERC721 test wrapper functions for diamond/facet architectures.
 * @dev Implements diamond introspection and exposes burn, transfer, setApprovalForAll, and baseURI.
 *      - Should be registered in the diamond with all required selectors for test scenarios.
 */
contract ERC721TestWrapperFacet is ERC721TestWrapper, IEIP2535Introspection {
    // Introspection for diamond pattern
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC721_TEST_WRAPPER_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 3;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.transfer.selector;
        selectors_[--selectorsLength] = this.callSetApprovalForAll.selector;
        selectors_[--selectorsLength] = this.baseURI.selector;
    }
}
