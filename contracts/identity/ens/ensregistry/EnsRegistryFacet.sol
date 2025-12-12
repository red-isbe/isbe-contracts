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

import {EnsRegistry} from './EnsRegistry.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {_ENS_REGISTRY_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';

/// @title EnsRegistryFacet
/// @notice Faceta EIP-2535 que expone la funcionalidad del registro ENS
/// @dev Hereda de EnsRegistry y publica introspección de interfaces/negocio/selectores
contract EnsRegistryFacet is EnsRegistry, IEIP2535Introspection {
    function interfacesIntrospection()
        external
        pure
        override
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
        businessId_ = _ENS_REGISTRY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 13;
        selectors_ = new bytes4[](selectorsLength);

        selectors_[--selectorsLength] = this.initialiseEnsRegistry.selector;
        selectors_[--selectorsLength] = this.setRecord.selector;
        selectors_[--selectorsLength] = this.setSubnodeRecord.selector;
        selectors_[--selectorsLength] = this.setSubnodeOwner.selector;
        selectors_[--selectorsLength] = this.setResolver.selector;
        selectors_[--selectorsLength] = this.setOwner.selector;
        selectors_[--selectorsLength] = this.setTTL.selector;
        selectors_[--selectorsLength] = this.setApprovalForAll.selector;
        selectors_[--selectorsLength] = this.owner.selector;
        selectors_[--selectorsLength] = this.resolver.selector;
        selectors_[--selectorsLength] = this.ttl.selector;
        selectors_[--selectorsLength] = this.recordExists.selector;
        selectors_[--selectorsLength] = this.isApprovedForAll.selector;
    }
}
