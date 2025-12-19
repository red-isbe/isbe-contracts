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

import {_ACCOUNT_ABSTRACTION_SMART_ACCOUNT_FACTORY_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {SmartAccountFactory} from './SmartAccountFactory.sol';
import {IEIP2535Introspection} from '../../../proxies/eip2535/interfaces/IEIP2535Introspection.sol';

/**
 * @title ERC-4337 Smart account factory facet
 * @notice EIP-2535 facet that exposes ERC-4337 smart account factory functionality for modular proxy systems.
 * @dev Implements introspection for diamond compatibility and delegates core logic to
 *      the {SmartAccountFactory} base contract. Provides metadata about supported interfaces,
 *      business identifiers, and exposed function selectors. Enables dynamic discovery
 *      and upgrade management within a facet-based architecture.
 * @author ISBE Development Team
 */
contract SmartAccountFactoryFacet is
    SmartAccountFactory,
    IEIP2535Introspection
{
    constructor() {
        _disableInitializers(
            _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_FACTORY_RESOLVER_KEY
        );
    }

    function businessIdIntrospection()
        external
        pure
        override
        returns (bytes32 businessId_)
    {
        businessId_ = _ACCOUNT_ABSTRACTION_SMART_ACCOUNT_FACTORY_RESOLVER_KEY;
    }

    function selectorsIntrospection()
        external
        pure
        override
        returns (bytes4[] memory selectors_)
    {
        uint256 selectorsLength = 1;
        selectors_ = new bytes4[](selectorsLength);
        selectors_[--selectorsLength] = this.createAccount.selector;
    }

    function interfacesIntrospection()
        external
        pure
        returns (bytes4[] memory interfaces_)
    {
        return _implementedInterfaces();
    }
}
