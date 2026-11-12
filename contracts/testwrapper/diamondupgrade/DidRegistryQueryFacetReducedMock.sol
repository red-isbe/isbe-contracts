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

import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _DID_REGISTRY_QUERY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title DidRegistryQueryFacetReducedMock
 * @author ISBE
 * @notice New version of the DID registry query facet that drops `isKnownDid`.
 * @dev Used by the diamond upgrade tests to check that removing functions requires
 *      an explicit flag. It declares no interface, so the old interface id is removed too.
 */
contract DidRegistryQueryFacetReducedMock is IEIP2535Introspection {
    bytes32 public constant VERSION_MARKER =
        keccak256('DidRegistryQueryReduced');

    function didOf(address) external pure returns (bytes32) {
        return VERSION_MARKER;
    }

    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](0);
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _DID_REGISTRY_QUERY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        selectors_ = new bytes4[](1);
        selectors_[0] = this.didOf.selector;
    }
}
