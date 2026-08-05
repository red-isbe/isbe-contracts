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
    _ERC203643_CONTROLLER_RESOLVER_KEY
} from '../../../constants/resolverKeys.sol';
import {ERC203643Controller} from './ERC203643Controller.sol';
import {
    IEIP2535Introspection
} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/// @title ERC203643ControllerFacet
/// @notice Diamond facet for unified ERC20/ERC3643 controller operations
/// @dev Provides force transfer and burn capabilities for both token standards
contract ERC203643ControllerFacet is
    ERC203643Controller,
    IEIP2535Introspection
{
    /**
     * @dev Returns the interfaces implemented by this facet
     * @return interfaces_ Array of interface identifiers
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @dev Returns the business identifier for this facet
     * @return businessId_ The resolver key for this facet
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC203643_CONTROLLER_RESOLVER_KEY;
    }

    /**
     * @dev Returns the function selectors exposed by this facet
     * @return selectors_ Array of function selectors
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 4;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.forceTransfer.selector;
        selectors_[--selectorsLength] = this.forceBurn.selector;
        selectors_[--selectorsLength] = this.batchForceBurn.selector;
        selectors_[--selectorsLength] = this.batchForceTransfer.selector;
    }
}
