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
// prettier-ignore
import {
    _ENS_NAME_RESOLVER_STORAGE_POSITION // solhint-disable-line no-unused-import
} from '../../../../../constants/storagePositions.sol';

/**
 * @title ENS Name Resolver Internal Implementation
 * @notice Internal implementation contract providing ENS name resolution functionality
 * @dev Abstract contract implementing the core logic for ENS name resolution (reverse DNS).
 *      Extends EnsResolverInternal to inherit authorization and delegation capabilities.
 *      Uses unstructured storage to enable upgradeable proxy patterns
 * @author ISBE Development Team
 */
abstract contract NameResolverInternal is EnsResolverInternal {
    /**
     * @notice Storage structure containing ENS name resolver state data
     * @param names Maps node hashes to their associated human-readable names
     */
    struct NameResolverStorage {
        // node => name
        mapping(bytes32 => string) names;
    }

    /**
     * @notice Associates a human-readable name with an ENS node
     * @dev Internal function storing canonical name for reverse DNS resolution
     * @param _node The ENS node hash to receive the name association
     * @param _newName The human-readable name to associate with the node
     */
    function _setName(bytes32 _node, string memory _newName) internal {
        _nameResolverStorage().names[_node] = _newName;
    }

    /**
     * @notice Retrieves the human-readable name associated with an ENS node
     * @dev Internal view function providing access to stored name data for reverse resolution
     * @param _node The ENS node hash to query for its associated name
     * @return The human-readable name linked to the specified node
     */
    function _name(bytes32 _node) internal view returns (string memory) {
        return _nameResolverStorage().names[_node];
    }

    /**
     * @notice Retrieves the unstructured storage reference for NameResolver data
     * @dev Private pure function providing access to storage slot using assembly
     * @return storage_ Reference to the NameResolverStorage struct in storage
     */
    function _nameResolverStorage()
        private
        pure
        returns (NameResolverStorage storage storage_)
    {
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := _ENS_NAME_RESOLVER_STORAGE_POSITION
        }
        // slither-disable-end assembly
    }
}
