// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {INameResolver} from './INameResolver.sol';
import {NameResolverInternal} from './NameResolverInternal.sol';

/**
 * @title ENS Name Resolver External Interface
 * @notice External implementation of ENS name resolver providing reverse DNS functionality
 * @dev Abstract contract that exposes the INameResolver interface whilst delegating core logic
 *      to internal functions. Applies pause protection on write operations, authorisation checks,
 *      and role-based access control. Extends NameResolverInternal for storage management
 * @author ISBE Development Team
 */
abstract contract NameResolver is INameResolver, NameResolverInternal {
    /**
     * @notice Associates a human-readable name with an ENS node for reverse resolution
     * @dev Enables reverse DNS lookups by storing the canonical name for a given node
     * @param node The ENS node hash to receive the name association
     * @param newName The human-readable name to associate with the specified node
     */
    function setName(
        bytes32 node,
        string calldata newName
    ) external override whenNotPaused onlyAuthorised(node) {
        _setName(node, newName);
        emit NameChanged(node, newName);
    }

    /**
     * @notice Retrieves the human-readable name associated with an ENS node
     * @dev Returns the canonical name for reverse DNS resolution as defined in EIP-181
     * @param node The ENS node hash to query for its associated name
     * @return associatedName The human-readable name linked to the specified node
     */
    function name(
        bytes32 node
    ) external view override returns (string memory associatedName) {
        return _name(node);
    }

    /**
     * @notice Provides interface introspection support for ENS name resolver compatibility
     * @dev Internal pure function enabling ERC-165 interface detection for ENS name resolver.
     *      Returns only INameResolver interface support
     * @return interfaces_ Array containing the interface identifiers supported by this resolver
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(INameResolver).interfaceId;
    }
}
