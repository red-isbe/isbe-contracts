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

import {EnsResolverInternal} from '../../ensresolver/EnsResolverInternal.sol';
// solhint-disable-next-line no-unused-import
import {_ENS_TEXT_RESOLVER_STORAGE_POSITION} from '../../../../../constants/storagePositions.sol';

/**
 * @title ENS Text Resolver Internal Implementation
 * @notice Internal implementation contract providing ENS text resolution functionality
 * @dev Abstract contract implementing the core logic for ENS text record management.
 *      Extends EnsResolverInternal to inherit authorization and delegation capabilities.
 *      Uses unstructured storage to enable upgradeable proxy patterns
 * @author ISBE Development Team
 */
abstract contract TextResolverInternal is EnsResolverInternal {
    /**
     * @notice Storage structure containing ENS text resolver state data
     * @param texts Maps node hashes to key-value text record storage
     */
    struct TextResolverStorage {
        // node => key => value
        mapping(bytes32 => mapping(string => string)) texts;
    }

    /**
     * @notice Associates text data with an ENS node using a specified key
     * @dev Internal function storing arbitrary text metadata for flexible information management
     * @param _node The ENS node hash to receive the text data assignment
     * @param _key The text data key identifier for metadata categorisation
     * @param _value The text data value to store for the specified key
     */
    function _setText(
        bytes32 _node,
        string memory _key,
        string memory _value
    ) internal {
        _textResolverStorage().texts[_node][_key] = _value;
    }

    /**
     * @notice Retrieves text data associated with an ENS node and key
     * @dev Internal view function providing access to stored text metadata
     * @param _node The ENS node hash to query for text data
     * @param _key The text data key identifier to retrieve the value for
     * @return The text data value associated with the node and key
     */
    function _text(
        bytes32 _node,
        string memory _key
    ) internal view returns (string memory) {
        return _textResolverStorage().texts[_node][_key];
    }

    /**
     * @notice Retrieves the unstructured storage reference for TextResolver data
     * @dev Private pure function providing access to storage slot using assembly
     * @return storage_ Reference to the TextResolverStorage struct in storage
     */
    function _textResolverStorage()
        private
        pure
        returns (TextResolverStorage storage storage_)
    {
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := _ENS_TEXT_RESOLVER_STORAGE_POSITION
        }
        // slither-disable-end assembly
    }
}
