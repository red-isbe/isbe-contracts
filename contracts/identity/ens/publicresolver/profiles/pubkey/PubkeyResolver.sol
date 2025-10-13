// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IPubkeyResolver} from './IPubkeyResolver.sol';
import {PubkeyResolverInternal} from './PubkeyResolverInternal.sol';

/**
 * @title ENS Public Key Resolver External Interface
 * @notice External implementation of ENS pubkey resolver providing SECP256k1 public key management
 * @dev Abstract contract that exposes the IPubkeyResolver interface whilst delegating core logic
 *      to internal functions. Applies pause protection on write operations, authorisation checks,
 *      and role-based access control. Extends PubkeyResolverInternal for storage management
 * @author ISBE Development Team
 */
abstract contract PubkeyResolver is IPubkeyResolver, PubkeyResolverInternal {
    /**
     * @notice Associates a SECP256k1 public key with an ENS node
     * @dev Stores the elliptic curve coordinates for cryptographic verification purposes
     * @param node The ENS node hash to receive the public key assignment
     * @param x The X coordinate of the SECP256k1 elliptic curve point
     * @param y The Y coordinate of the SECP256k1 elliptic curve point
     */
    function setPubkey(
        bytes32 node,
        bytes32 x,
        bytes32 y
    ) external override whenNotPaused onlyAuthorised(node) {
        _setPubkey(node, x, y);
        emit PubkeyChanged(node, x, y);
    }

    /**
     * @notice Retrieves the SECP256k1 public key associated with an ENS node
     * @dev Returns the elliptic curve coordinates as defined in EIP-619 specification
     * @param node The ENS node hash to query for its associated public key
     * @return xCoordinate The X coordinate of the elliptic curve point for the public key
     * @return yCoordinate The Y coordinate of the elliptic curve point for the public key
     */
    function pubkey(
        bytes32 node
    )
        external
        view
        override
        returns (bytes32 xCoordinate, bytes32 yCoordinate)
    {
        return _pubkey(node);
    }

    /**
     * @notice Provides interface introspection support for ENS pubkey resolver compatibility
     * @dev Internal pure function enabling ERC-165 interface detection for ENS pubkey resolver.
     *      Returns only IPubkeyResolver interface support
     * @return interfaces_ Array containing the interface identifiers supported by this resolver
     */
    function _implementedInterfaces()
        internal
        pure
        override
        returns (bytes4[] memory interfaces_)
    {
        interfaces_ = new bytes4[](1);
        interfaces_[0] = type(IPubkeyResolver).interfaceId;
    }
}
