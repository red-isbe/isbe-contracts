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
    _ACCESS_CONTROL_DID_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';
import {AccessControlDid} from './AccessControlDid.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title AccessControlDidFacet
/// @notice Access Control DID Facet smart contract
/// @dev Adds IEIP2535Introspection functionality for DID-based access control
contract AccessControlDidFacet is AccessControlDid, IEIP2535Introspection {
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
        businessId_ = _ACCESS_CONTROL_DID_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 8;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this
            .initializeDidAccessControl
            .selector;
        selectors_[--selectorsLength] = this.grantDidRole.selector;
        selectors_[--selectorsLength] = this.revokeDidRole.selector;
        selectors_[--selectorsLength] = this
            .getRoleMembersCountForDids
            .selector;
        selectors_[--selectorsLength] = this.getDidRoleMembers.selector;
        selectors_[--selectorsLength] = this.getRolesByDidLength.selector;
        selectors_[--selectorsLength] = this.getRolesByDid.selector;
        selectors_[--selectorsLength] = this.hasRoleForDid.selector;
    }
}
