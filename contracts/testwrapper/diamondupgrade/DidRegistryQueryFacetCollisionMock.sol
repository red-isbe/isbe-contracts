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
    IDiamondLoupe
} from '../../proxies/eip2535/interfaces/IDiamondLoupe.sol';
import {
    _DID_REGISTRY_QUERY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {
    IDidRegistryQuery
} from '../../identity/didregistry/interfaces/IDidRegistryQuery.sol';

/**
 * @title DidRegistryQueryFacetCollisionMock
 * @author ISBE
 * @notice New version of the DID registry query facet that also claims `facets()`,
 *         a function that belongs to DiamondLoupeFacet.
 * @dev Used by the diamond upgrade tests to check that a function is never moved
 *      from one facet to another by a partial upgrade.
 */
contract DidRegistryQueryFacetCollisionMock is IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IDidRegistryQuery).interfaceId;
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
        selectors_ = new bytes4[](3);
        selectors_[0] = IDidRegistryQuery.didOf.selector;
        selectors_[1] = IDidRegistryQuery.isKnownDid.selector;
        selectors_[2] = IDiamondLoupe.facets.selector;
    }
}
