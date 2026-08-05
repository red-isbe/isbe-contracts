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
    _NETWORK_DIRECTORY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {INetworkDirectory} from './INetworkDirectory.sol';
import {NetworkDirectory} from './NetworkDirectory.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title NetworkDirectoryFacet
 * @notice Diamond facet implementing network directory functionality with EIP-2535 introspection
 * @dev This contract serves as a diamond facet for the network directory system.
 *      It combines the NetworkDirectory functionality with EIP-2535 introspection capabilities
 *      to support diamond proxy pattern deployment and management.
 * @author ISBE Development Team
 */
contract NetworkDirectoryFacet is NetworkDirectory, IEIP2535Introspection {
    /**
     * @notice Returns the interfaces implemented by this facet
     * @dev Used for EIP-165 interface detection in diamond proxies
     * @return interfaces_ Array of interface IDs implemented by this facet
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business identifier for this facet
     * @dev Used for facet identification and resolution in diamond architecture
     * @return businessId_ The unique business identifier for network directory functionality
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _NETWORK_DIRECTORY_RESOLVER_KEY;
    }

    /**
     * @notice Returns all function selectors implemented by this facet
     * @dev Used by diamond proxy for function routing and facet management
     * @return selectors_ Array of 4-byte function selectors implemented by this facet
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 13;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.createNetwork.selector;
        selectors_[--selectorsLength] = this.updateNetwork.selector;
        selectors_[--selectorsLength] = this.deleteNetwork.selector;
        selectors_[--selectorsLength] = this.getNetwork.selector;
        selectors_[--selectorsLength] = this.getAllNetworks.selector;
        selectors_[--selectorsLength] = this.getNetworksByAlgorithm.selector;
        selectors_[--selectorsLength] = this.getNetworksPaginated.selector;
        selectors_[--selectorsLength] = this.getNetworksCount.selector;
        selectors_[--selectorsLength] = this.setResource.selector;
        selectors_[--selectorsLength] = this.deleteResource.selector;
        selectors_[--selectorsLength] = this.getResourceKeys.selector;
        selectors_[--selectorsLength] = this.getResourceKeysPaginated.selector;
        selectors_[--selectorsLength] = this.getResourceCount.selector;
    }

    /**
     * @notice Returns the interfaces implemented by this contract
     * @dev Internal function used by interfacesIntrospection for EIP-165 support
     * @return interfaces_ Array containing the INetworkDirectory interface ID
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(INetworkDirectory).interfaceId;
    }
}
