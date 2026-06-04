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

import {SmartAccount} from './SmartAccount.sol';
import {
    IEIP2535Introspection
} from '../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';
import {
    _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY
} from '../../constants/resolverKeys.sol';

/**
 * @title ERC-4337 Smart account Facet
 * @notice EIP-2535 facet that exposes ERC-4337 smart account functionality for modular proxy systems.
 * @dev Implements introspection for diamond compatibility and delegates core logic to
 *      the {SmartAccount} base contract. Provides metadata about supported interfaces,
 *      business identifiers, and exposed function selectors. Enables dynamic discovery
 *      and upgrade management within a facet-based architecture.
 * @author ISBE Development Team
 */
contract SmartAccountFacet is SmartAccount, IEIP2535Introspection {
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
        businessId_ = _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 8;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.initializeSmartAccount.selector;
        selectors_[--selectorsLength] = this.execute.selector;
        selectors_[--selectorsLength] = this.validateUserOp.selector;
        selectors_[--selectorsLength] = this.onERC721Received.selector;
        selectors_[--selectorsLength] = this.onERC1155Received.selector;
        selectors_[--selectorsLength] = this.onERC1155BatchReceived.selector;
        selectors_[--selectorsLength] = this.supportsInterface.selector;
        selectors_[--selectorsLength] = this.updateEntryPoint.selector;
    }
}
