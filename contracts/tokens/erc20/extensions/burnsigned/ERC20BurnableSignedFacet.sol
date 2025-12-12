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

import {_ERC20_BURNABLE_SIGNED_RESOLVER_KEY} from '../../../../constants/resolverKeys.sol';
import {ERC20BurnableSigned} from './ERC20BurnableSigned.sol';
import {IEIP2535Introspection} from '../../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC203643 Burnable Signed Facet
 * @notice Implements EIP-2535 introspection for the ERC203643 burnable signed module
 * @dev Provides interface and selector introspection capabilities for diamond proxy integration.
 *      Inherits ERC20BurnableSigned functionality and implements IEIP2535Introspection.
 * @author [Author or team]
 */
contract ERC20BurnableSignedFacet is
    ERC20BurnableSigned,
    IEIP2535Introspection
{
    /**
     * @notice Returns the list of interfaces implemented by this contract
     * @dev Overrides the base implementation to specify supported interface identifiers
     * @return interfaces_ Array of interface identifiers supported by this contract
     */
    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }

    /**
     * @notice Returns the business identifier for this contract module
     * @dev Returns the resolver key constant used to identify this module in the diamond proxy
     * @return businessId_ The business identifier for this contract module
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ERC20_BURNABLE_SIGNED_RESOLVER_KEY;
    }

    /**
     * @notice Returns the list of function selectors implemented by this contract
     * @dev Overrides the base implementation to specify supported function selectors
     * @return selectors_ Array of function selectors supported by this contract
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 2;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.burnWithSignature.selector;
        selectors_[--selectorsLength] = this.burnFromWithSignature.selector;
    }
}
