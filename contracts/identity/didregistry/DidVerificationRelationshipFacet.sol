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

import {DidVerificationRelationship} from './DidVerificationRelationship.sol';
import {
    IDidVerificationRelationship
} from './interfaces/IDidVerificationRelationship.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title DID Verification Relationship Diamond Facet
 * @notice Diamond facet implementation for managing verification relationships between
 *         decentralised identifiers and cryptographic verification methods
 * @dev Extends DidVerificationRelationship functionality with EIP-2535 Diamond Standard
 *      introspection capabilities. Provides interface discovery and selector enumeration
 *      for verification relationship management operations within the diamond proxy
 * @author ISBE Development Team
 */
contract DidVerificationRelationshipFacet is
    DidVerificationRelationship,
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
        businessId_ = _DID_VERIFICATION_RELATIONSHIP_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this
            .addVerificationRelationship
            .selector;
        selectors_[--selectorsLength] = this
            .getDidsByVerificationRelationship
            .selector;
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
        interfaces_[--interfacesLength] = type(IDidVerificationRelationship)
            .interfaceId;
    }
}
