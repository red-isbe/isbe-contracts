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

/**
 * @title ENS Public Key Resolver Interface
 * @notice Interface for managing SECP256k1 public key records within ENS nodes
 * @dev Provides functionality to store and retrieve elliptic curve public keys for
 *      cryptographic verification and digital signature operations as defined in EIP-619
 * @author ISBE Development Team
 */
interface IPubkeyResolver {
    /**
     * @notice Emitted when a public key is associated with an ENS node
     * @param node The ENS node hash receiving the new public key assignment
     * @param x The X coordinate of the elliptic curve point for the public key
     * @param y The Y coordinate of the elliptic curve point for the public key
     */
    event PubkeyChanged(bytes32 indexed node, bytes32 x, bytes32 y);

    /**
     * @notice Associates a SECP256k1 public key with an ENS node
     * @dev Stores the elliptic curve coordinates for cryptographic verification purposes
     * @param node The ENS node hash to receive the public key assignment
     * @param x The X coordinate of the SECP256k1 elliptic curve point
     * @param y The Y coordinate of the SECP256k1 elliptic curve point
     */
    function setPubkey(bytes32 node, bytes32 x, bytes32 y) external;

    /**
     * @notice Retrieves the SECP256k1 public key associated with an ENS node
     * @dev Returns the elliptic curve coordinates as defined in EIP-619 specification
     * @param node The ENS node hash to query for its associated public key
     * @return xCoordinate The X coordinate of the elliptic curve point for the public key
     * @return yCoordinate The Y coordinate of the elliptic curve point for the public key
     */
    function pubkey(
        bytes32 node
    ) external view returns (bytes32 xCoordinate, bytes32 yCoordinate);
}
