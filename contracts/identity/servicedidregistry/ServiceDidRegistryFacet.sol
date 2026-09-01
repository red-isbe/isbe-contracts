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
    _SERVICE_DID_REGISTRY_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {IServiceDidRegistry} from './interfaces/IServiceDidRegistry.sol';
import {ServiceDidRegistry} from './ServiceDidRegistry.sol';

/**
 * @title Service DID Registry Facet
 * @notice Diamond facet exposing the delegated operational identity registry with
 *         introspection capabilities
 * @dev Concrete implementation of the diamond facet pattern for the `did:isbe:svc`
 *      sub-namespace. Combines the registry functionality with EIP-2535 interface
 *      introspection so that selectors and supported interfaces can be discovered
 *      dynamically when the facet is cut into the diamond.
 *
 *      Additive over the existing 0x15BE Diamond: no redeployment, no change to any
 *      existing selector, and a fresh namespaced storage slot.
 * @author ISBE Development Team
 */
contract ServiceDidRegistryFacet is ServiceDidRegistry, IEIP2535Introspection {
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
        businessId_ = _SERVICE_DID_REGISTRY_RESOLVER_KEY;
    }

    /**
     * @dev Ten selectors. `getServiceDidCountByController` was dropped because
     *      `getServiceDidsByController` already returns `total`, which is the
     *      convention of this repository: a five-tuple getter carries no companion
     *      counter, a bare-array one does. Each selector is frozen into the Diamond's
     *      ABI, so removing one after the first deployment would require a DiamondCut.
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 10;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.signingKeyAddressOf.selector;
        selectors_[--selectorsLength] = this
            .initializeServiceDidRegistry
            .selector;
        selectors_[--selectorsLength] = this.registerServiceDid.selector;
        selectors_[--selectorsLength] = this.rotateSigningKey.selector;
        selectors_[--selectorsLength] = this.updateExpiry.selector;
        selectors_[--selectorsLength] = this.deactivateServiceDid.selector;
        selectors_[--selectorsLength] = this.getServiceDid.selector;
        selectors_[--selectorsLength] = this
            .getServiceDidsByController
            .selector;
        selectors_[--selectorsLength] = this.isServiceDidActive.selector;
        selectors_[--selectorsLength] = this.computeServiceDid.selector;
    }

    function _implementedInterfaces()
        internal
        pure
        virtual
        override
        returns (bytes4[] memory interfaces_)
    {
        uint256 interfacesLength = 1;
        interfaces_ = new bytes4[](interfacesLength);
        interfaces_[--interfacesLength] = type(IServiceDidRegistry).interfaceId;
    }
}
