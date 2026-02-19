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
-------------------------------------------------------------- */
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EntryPoint} from './EntryPoint.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _ACCOUNT_ABSTRACTION_ENTRYPOINT_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title EntryPoint diamond facet
 * @notice EIP-2535 facet exposing the EntryPoint functionality and
 *         introspection metadata.
 * @dev Wraps the EntryPoint implementation and provides selector,
 *      interface and business identifier introspection required by
 *      EIP-2535 compatible proxies.
 * @author ISBE Development Team
 */
contract EntryPointFacet is EntryPoint, IEIP2535Introspection {
    /**
     * @notice Returns the list of interfaces implemented by this facet.
     * @dev Forwards to the internal `_implementedInterfaces` helper
     *      from the EntryPoint base. Used by the diamond to expose
     *      ERC-165 interface support per facet.
     * @return interfaces_ Array of supported interface identifiers.
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
     * @notice Returns the business identifier associated with this facet.
     * @dev The business identifier is used by the resolver to map
     *      this facet to a specific functional domain (EntryPoint).
     * @return businessId_ Resolver key for the EntryPoint facet.
     */
    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ACCOUNT_ABSTRACTION_ENTRYPOINT_RESOLVER_KEY;
    }

    /**
     * @notice Returns all function selectors implemented by this facet.
     * @dev Enumerates the selectors of the EntryPoint surface and
     *      the internal `innerHandleOp` used by the core execution
     *      flow. The order is not semantically relevant but must
     *      include every selector owned by the facet.
     * @return selectors_ Array of function selectors implemented
     *         by this facet.
     */
    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 12;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.handleOps.selector;
        selectors_[--selectorsLength] = this.getUserOpHash.selector;
        selectors_[--selectorsLength] = this.getDepositInfo.selector;
        selectors_[--selectorsLength] = this.balanceOf.selector;
        selectors_[--selectorsLength] = this.depositTo.selector;
        selectors_[--selectorsLength] = this.addStake.selector;
        selectors_[--selectorsLength] = this.unlockStake.selector;
        selectors_[--selectorsLength] = this.withdrawStake.selector;
        selectors_[--selectorsLength] = this.withdrawTo.selector;
        selectors_[--selectorsLength] = this.getNonce.selector;
        selectors_[--selectorsLength] = this.incrementNonce.selector;
        selectors_[--selectorsLength] = this.innerHandleOp.selector;
    }
}
