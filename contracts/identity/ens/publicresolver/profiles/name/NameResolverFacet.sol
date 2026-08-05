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

import {NameResolver} from './NameResolver.sol';
import {
    IEIP2535Introspection
} from '../../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _ENS_NAME_RESOLVER_RESOLVER_KEY
} from '../../../../../constants/resolverKeys.sol';

/**
 * @title ENS Name Resolver Facet
 * @notice EIP-2535 facet that exposes the ENS name resolver functionality
 * @dev Inherits from NameResolver and provides introspection of interfaces, business logic, and selectors
 * @author ISBE Development Team
 */
contract NameResolverFacet is NameResolver, IEIP2535Introspection {
    /**
     * @notice Returns the interfaces implemented by this facet
     * @dev Provides ERC-165 interface introspection for ENS name resolver compatibility
     * @return interfaces_ Array containing the interface identifiers supported by this facet
     */
    function interfacesIntrospection()
        external
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business identifier for this facet
     * @dev Provides the unique resolver key that identifies this business logic component
     * @return businessId_ The resolver key that uniquely identifies this ENS name resolver implementation
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        return _ENS_NAME_RESOLVER_RESOLVER_KEY;
    }

    /**
     * @notice Returns the function selectors exposed by this facet
     * @dev Lists all external functions available through this facet for diamond proxy integration
     * @return selectors_ Array of function selectors that this facet makes available
     */
    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);

        // Name resolver functions only
        selectors_[--selectorsLength] = this.setName.selector;
        selectors_[--selectorsLength] = this.name.selector;
    }
}
