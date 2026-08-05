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

import {ConfigurationManagement} from './ConfigurationManagement.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _CONFIGURATION_MANAGEMENT_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title Configuration Management Facet
 * @author ISBE
 * @notice An EIP-2535 facet for the configuration management system. This
 *         contract exposes functions to define and query use-case configs.
 * @dev Inherits from `ConfigurationManagement` and implements the standard
 *      EIP-2535 introspection interface. It makes the core configuration
 *      logic available for use within a diamond proxy.
 */
contract ConfigurationManagementFacet is
    ConfigurationManagement,
    IEIP2535Introspection
{
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
        businessId_ = _CONFIGURATION_MANAGEMENT_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 8;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.setConfiguration.selector;
        selectors_[--selectorsLength] = this.getConfiguration.selector;
        selectors_[--selectorsLength] = this.checkConfiguration.selector;
        selectors_[--selectorsLength] = this.facets.selector;
        selectors_[--selectorsLength] = this.facetFunctionSelectors.selector;
        selectors_[--selectorsLength] = this.facetAddresses.selector;
        selectors_[--selectorsLength] = this.facetAddress.selector;
        selectors_[--selectorsLength] = this.facetSupportsInterface.selector;
    }
}
