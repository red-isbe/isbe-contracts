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
 * @title NetworkDirectory Custom Errors
 * @notice Typed errors for NetworkDirectory operations
 */

/**
 * @notice Enumeration of network deployment stages
 * @param NONE No stage specified or undefined
 * @param DEV Development environment
 * @param PRE Pre-production/staging environment
 * @param PROD Production environment
 */
enum Stage {
    NONE,
    DEV,
    PRE,
    PROD
}

/**
 * @notice Enumeration of cryptographic algorithms used by networks
 * @param NONE No algorithm specified or undefined
 * @param SECP256K1 Elliptic curve algorithm used in Bitcoin
 * @param SECP256R1 Elliptic curve algorithm used in Ethereum
 */
enum Algorithm {
    NONE,
    SECP256K1,
    SECP256R1
}

/**
 * @notice Structure representing a network resource (URL, endpoint, etc.)
 * @param resourceId Unique identifier for the resource type (e.g., "RPC", "EXPLORER")
 * @param resource The actual resource content (typically a URL or identifier)
 */
struct Resource {
    bytes32 resourceId;
    string resource;
}

/**
 * @notice Structure representing a complete blockchain network
 * @param chainId Unique blockchain network identifier (must be > 0)
 * @param name Short name of the network (≤ 32 bytes)
 * @param symbol Network currency symbol (≤ 32 bytes)
 * @param algorithm Cryptographic algorithm used (e.g., "secp256r1", "secp256k1")
 * @param stage Deployment stage of the network
 * @param resources Array of associated resources for the network
 */
struct NetworkData {
    uint256 chainId;
    bytes32 name;
    bytes32 symbol;
    Algorithm algorithm;
    Stage stage;
    Resource[] resources;
}

/**
 * @notice Structure representing updated network data (excluding resources)
 * @param chainId Unique blockchain network identifier (must be > 0)
 * @param name Short name of the network (≤ 32 bytes)
 * @param symbol Network currency symbol (≤ 32 bytes)
 * @param algorithm Cryptographic algorithm used (e.g., "secp256r1", "secp256k1")
 * @param stage Deployment stage of the network
 */
struct UpdateNetworkData {
    uint256 chainId;
    bytes32 name;
    bytes32 symbol;
    Algorithm algorithm;
    Stage stage;
}

/**
 * @notice Structure representing network data stored in storage (without chainId and resources)
 * @param name Short name of the network (≤ 32 bytes)
 * @param symbol Network currency symbol (≤ 32 bytes)
 * @param algorithm Cryptographic algorithm used (e.g., "secp256r1", "secp256k1")
 * @param stage Deployment stage of the network
 */
struct NetworkStorageData {
    bytes32 name;
    bytes32 symbol;
    Algorithm algorithm;
    Stage stage;
}

/// @notice Thrown when trying to access a network that doesn't exist
error NetworkNotFound(uint256 chainId);

/// @notice Thrown when trying to create a network that already exists
error NetworkAlreadyExists(uint256 chainId);

/// @notice Thrown when trying to access a resource that doesn't exist
error ResourceNotFound(uint256 chainId, bytes32 resourceId);

/// @notice Thrown when pagination parameters are invalid
error InvalidPaginationParams(uint256 offset, uint256 limit, uint256 maxLimit);

/// @notice Thrown when chainId is invalid (zero or exceeds maximum)
error InvalidChainId(uint256 chainId);

/// @notice Thrown when network stage is invalid
error InvalidStage();

/// @notice Thrown when network algorithm is invalid
error InvalidAlgorithm();

/// @notice Thrown when resourceId is empty
error EmptyResourceId();

/// @notice Thrown when a duplicate resource is detected
error DuplicatedResource(bytes32 resourceId, bytes32 duplicatedResourceId);

/**
 * @notice Converts NetworkData to NetworkStorageData by removing chainId and resources
 * @dev Pure function that extracts core network metadata for storage
 * @param network The NetworkData to convert
 * @return storageData The converted NetworkStorageData
 */
function _fromNetworkDataToNetworkStorageData(
    NetworkData calldata network
) pure returns (NetworkStorageData memory storageData) {
    storageData = NetworkStorageData({
        name: network.name,
        symbol: network.symbol,
        algorithm: network.algorithm,
        stage: network.stage
    });
}
