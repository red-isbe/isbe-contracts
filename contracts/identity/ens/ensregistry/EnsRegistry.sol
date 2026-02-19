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

import {ENS} from './ENS.sol';
import {EnsRegistryInternal} from './EnsRegistryInternal.sol';
import {_ENS_REGISTRY_RESOLVER_KEY} from '../../../constants/resolverKeys.sol';
import {
    _ENS_REGISTRY_FACET_VERSION
} from '../../../constants/facetVersions.sol';

/**
 * @title ENS Registry External Interface
 * @notice External implementation of ENS domain name registry with pause and authorisation controls
 * @dev Abstract contract that exposes the ENS interface whilst delegating core logic to internal
 *      functions. Applies pause protection on write operations, authorisation checks, and
 *      role-based access control for administrative operations. Implements ERC-165 interface
 *      introspection for ENS compatibility
 * @author ISBE
 */
abstract contract EnsRegistry is ENS, EnsRegistryInternal {
    /**
     * @notice Initializes the ENS registry with a specified owner root node.
     * @param _ownerRootNode The address of the owner's root node in the ENS registry.
     */
    function initialiseEnsRegistry(
        address _ownerRootNode
    )
        external
        override
        addressIsNotZero(_ownerRootNode)
        initializer(_ENS_REGISTRY_RESOLVER_KEY, _ENS_REGISTRY_FACET_VERSION)
    {
        _createRootNode(bytes32(0), _ownerRootNode);
        emit EnsRegistryInitialised(_ownerRootNode);
    }

    /**
     * @notice Sets the complete record data for a node in a single atomic operation
     * @dev External function with pause and authorisation protection. Updates owner, resolver,
     *      and TTL simultaneously for gas optimisation and consistency
     * @param _node The node hash to update with new record data
     * @param _owner The new owner address for the node
     * @param _resolver The new resolver contract address for resolution queries
     * @param _ttl The new time-to-live value in seconds for caching
     */
    function setRecord(
        bytes32 _node,
        address _owner,
        address _resolver,
        uint64 _ttl
    )
        external
        override
        whenNotPaused
        addressIsNotZero(_owner)
        addressIsNotZero(_resolver)
        onlyAuthorised(_node)
    {
        _setRecord(_node, _owner, _resolver, _ttl);
    }

    /**
     * @notice Creates or updates a subnode with complete record information
     * @dev External function that computes subnode hash and sets all record fields atomically.
     *      Requires authorisation on the parent node and respects pause state
     * @param node The parent node hash under which to create the subnode
     * @param label The label hash identifying the subdomain name
     * @param owner_ The owner address for the new subnode
     * @param resolver_ The resolver contract address for the subnode
     * @param ttl_ The time-to-live value in seconds for the subnode
     */
    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner_,
        address resolver_,
        uint64 ttl_
    )
        external
        whenNotPaused
        bytes32IsNotZero(label)
        addressIsNotZero(owner_)
        addressIsNotZero(resolver_)
        onlyAuthorised(node)
    {
        _setSubnodeRecord(node, label, owner_, resolver_, ttl_);
    }

    /**
     * @notice Creates a new subnode or transfers ownership of an existing subnode
     * @dev External function that computes the subnode hash and assigns ownership.
     *      Emits NewOwner event and requires parent node authorisation
     * @param node The parent node hash under which to create or modify the subnode
     * @param label The label hash for the subdomain identifier
     * @param owner_ The address to receive ownership of the subnode
     * @return subnodeHash The computed hash of the created or modified subnode
     */
    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner_
    )
        external
        whenNotPaused
        bytes32IsNotZero(label)
        addressIsNotZero(owner_)
        onlyAuthorised(node)
        returns (bytes32 subnodeHash)
    {
        subnodeHash = _setSubnodeOwner(node, label, owner_);
    }

    /**
     * @notice Updates the resolver contract address for domain name resolution
     * @dev External function that sets the resolver for a node with authorisation and pause
     *      checks. Emits NewResolver event for off-chain tracking
     * @param node The node hash to update with a new resolver
     * @param resolver_ The new resolver contract address for handling queries
     */
    function setResolver(
        bytes32 node,
        address resolver_
    ) external whenNotPaused addressIsNotZero(resolver_) onlyAuthorised(node) {
        _setResolver(node, resolver_);
    }

    /**
     * @notice Transfers ownership of a domain node to a new address
     * @dev External function that changes node ownership with proper authorisation checks.
     *      Emits Transfer event and respects system pause state
     * @param node The node hash to transfer to a new owner
     * @param owner_ The address to receive ownership of the node
     */
    function setOwner(
        bytes32 node,
        address owner_
    ) external whenNotPaused addressIsNotZero(owner_) onlyAuthorised(node) {
        _setOwner(node, owner_);
    }

    /**
     * @notice Updates the time-to-live value for domain caching behaviour
     * @dev External function that sets TTL with authorisation validation and pause protection.
     *      Emits NewTTL event for cache infrastructure updates
     * @param node The node hash to update with a new TTL value
     * @param ttl_ The new time-to-live value in seconds for caching duration
     */
    function setTTL(
        bytes32 node,
        uint64 ttl_
    ) external override whenNotPaused onlyAuthorised(node) {
        _setTTL(node, ttl_);
    }

    /**
     * @notice Grants or revokes operator approval for all caller's domain nodes
     * @dev External function enabling delegation of domain management rights.
     *      Emits ApprovalForAll event and respects pause state for security
     * @param operator The address to grant or revoke operator permissions
     * @param approved True to grant full operator rights, false to revoke them
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) external override whenNotPaused addressIsNotZero(operator) {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @notice Retrieves the current owner address of a domain node
     * @dev External view function providing read access to node ownership information
     * @param node The node hash to query for ownership
     * @return ownerAddress The address that currently owns the specified node
     */
    function owner(bytes32 node) external view returns (address ownerAddress) {
        ownerAddress = _owner(node);
    }

    /**
     * @notice Retrieves the resolver contract address for a domain node
     * @dev External view function providing access to resolution configuration
     * @param node The node hash to query for its resolver
     * @return resolverAddress The contract address handling resolution for this node
     */
    function resolver(
        bytes32 node
    ) external view returns (address resolverAddress) {
        resolverAddress = _resolver(node);
    }

    /**
     * @notice Retrieves the time-to-live value for domain caching
     * @dev External view function providing access to TTL configuration for cache management
     * @param node The node hash to query for its TTL value
     * @return ttlValue The time-to-live duration in seconds for caching
     */
    function ttl(bytes32 node) external view returns (uint64 ttlValue) {
        ttlValue = _ttl(node);
    }

    /**
     * @notice Checks whether a domain record has been explicitly created
     * @dev External view function determining if a node has been registered in the system
     * @param node The node hash to check for record existence
     * @return exists True if the record has been explicitly created, false otherwise
     */
    function recordExists(bytes32 node) external view returns (bool exists) {
        exists = _recordExists(node);
    }

    /**
     * @notice Checks if an operator has approval rights for all nodes of an owner
     * @dev External view function for validating delegation permissions
     * @param owner_ The address that owns the domain nodes
     * @param operator The address to check for operator approval status
     * @return isApproved True if operator has approval for all owner's nodes
     */
    function isApprovedForAll(
        address owner_,
        address operator
    ) external view override returns (bool isApproved) {
        isApproved = _isApprovedForAll(owner_, operator);
    }

    /**
     * @notice Provides interface introspection support for ENS compatibility
     * @dev Internal pure function enabling ERC-165 interface detection for ENS.
     *      Allows upper layers or facets to announce ENS interface support
     * @return interfaces_ Array containing the ENS interface identifier for introspection
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(ENS).interfaceId;
    }
}
