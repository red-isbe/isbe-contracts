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

import {ITextResolver} from './ITextResolver.sol';
import {TextResolverInternal} from './TextResolverInternal.sol';

/**
 * @title ENS Text Resolver External Interface
 * @notice External implementation of ENS text resolver providing key-value text record management
 * @dev Abstract contract that exposes the ITextResolver interface whilst delegating core logic
 *      to internal functions. Applies pause protection on write operations, authorisation checks,
 *      and role-based access control. Extends TextResolverInternal for storage management
 * @author ISBE Development Team
 */
abstract contract TextResolver is ITextResolver, TextResolverInternal {
    /**
     * @notice Associates text data with an ENS node using a specified key
     * @dev Stores arbitrary text metadata for flexible information management
     * @param node The ENS node hash to receive the text data assignment
     * @param key The text data key identifier for metadata categorisation
     * @param value The text data value to store for the specified key
     */
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external override whenNotPaused onlyAuthorised(node) {
        _setText(node, key, value);
        emit TextChanged(node, key, key, value);
    }

    /**
     * @notice Retrieves text data associated with an ENS node and key
     * @dev Returns the stored text metadata for the specified node and key combination
     * @param node The ENS node hash to query for text data
     * @param key The text data key identifier to retrieve the value for
     * @return textValue The text data value associated with the node and key
     */
    function text(
        bytes32 node,
        string calldata key
    ) external view override returns (string memory textValue) {
        return _text(node, key);
    }

    /**
     * @notice Provides interface introspection support for ENS text resolver compatibility
     * @dev Internal pure function enabling ERC-165 interface detection for ENS text resolver.
     *      Returns only ITextResolver interface support
     * @return interfaces_ Array containing the interface identifiers supported by this resolver
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(ITextResolver).interfaceId;
    }
}
