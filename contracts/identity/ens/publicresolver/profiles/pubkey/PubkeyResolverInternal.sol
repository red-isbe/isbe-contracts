// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {EnsResolverInternal} from '../../ensresolver/EnsResolverInternal.sol';
// solhint-disable-next-line no-unused-import
import {_ENS_PUBKEY_RESOLVER_STORAGE_POSITION} from '../../../../../constants/storagePositions.sol';

/**
 * @title ENS Public Key Resolver Internal Implementation
 * @notice Internal implementation contract providing ENS public key resolution functionality
 * @dev Abstract contract implementing the core logic for ENS SECP256k1 public key management.
 *      Extends EnsResolverInternal to inherit authorization and delegation capabilities.
 *      Uses unstructured storage to enable upgradeable proxy patterns
 * @author ISBE Development Team
 */
abstract contract PubkeyResolverInternal is EnsResolverInternal {
    /**
     * @notice Storage structure containing ENS pubkey resolver state data
     * @param pubkeys Maps node hashes to their associated public key coordinates
     */
    struct PubkeyResolverStorage {
        // node => pubkey (x, y coordinates)
        mapping(bytes32 => PublicKey) pubkeys;
    }

    /**
     * @notice Structure representing SECP256k1 public key coordinates
     * @param x The X coordinate of the elliptic curve point
     * @param y The Y coordinate of the elliptic curve point
     */
    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }

    /**
     * @notice Associates a SECP256k1 public key with an ENS node
     * @dev Internal function storing elliptic curve coordinates for cryptographic verification
     * @param _node The ENS node hash to receive the public key assignment
     * @param _x The X coordinate of the SECP256k1 elliptic curve point
     * @param _y The Y coordinate of the SECP256k1 elliptic curve point
     */
    function _setPubkey(bytes32 _node, bytes32 _x, bytes32 _y) internal {
        _pubkeyResolverStorage().pubkeys[_node] = PublicKey(_x, _y);
    }

    /**
     * @notice Retrieves the SECP256k1 public key associated with an ENS node
     * @dev Internal view function providing access to stored public key coordinates
     * @param _node The ENS node hash to query for its associated public key
     * @return xCoordinate The X coordinate of the elliptic curve point for the public key
     * @return yCoordinate The Y coordinate of the elliptic curve point for the public key
     */
    function _pubkey(
        bytes32 _node
    ) internal view returns (bytes32 xCoordinate, bytes32 yCoordinate) {
        PublicKey storage key = _pubkeyResolverStorage().pubkeys[_node];
        return (key.x, key.y);
    }

    /**
     * @notice Retrieves the unstructured storage reference for PubkeyResolver data
     * @dev Private pure function providing access to storage slot using assembly
     * @return storage_ Reference to the PubkeyResolverStorage struct in storage
     */
    function _pubkeyResolverStorage()
        private
        pure
        returns (PubkeyResolverStorage storage storage_)
    {
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            storage_.slot := _ENS_PUBKEY_RESOLVER_STORAGE_POSITION
        }
        // slither-disable-end assembly
    }
}
