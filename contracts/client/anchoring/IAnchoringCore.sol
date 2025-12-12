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
 * @title IAnchoringCore
 * @author ISBE Team
 * @notice Interface for cross-chain block anchoring functionality
 * @dev Defines the standard interface for managing cross-chain block anchoring operations,
 *      supporting multiple external chains with independent anchoring histories. Provides event
 *      definitions, errors, and function signatures for all anchoring operations within the ISBE ecosystem.
 */

/// @notice Complete block information for cross-chain anchoring
/// @dev Structure for storing anchored block details
struct BlockInfo {
    uint256 blockNumber;
    bytes32 blockHash;
    bytes32 stateRoot;
    uint256 timestamp;
    address anchorer;
}

/// @notice Builds a BlockInfo struct from individual components
/// @dev Pure function for creating complete block information
/// @param blockNumber The block number from the external chain
/// @param blockHash The block hash from the external chain
/// @param stateRoot The state root from the external chain
/// @param timestamp When the block was anchored
/// @param anchorer Address that performed the anchoring
/// @return The BlockInfo struct
function _buildBlockInfo(
    uint256 blockNumber,
    bytes32 blockHash,
    bytes32 stateRoot,
    uint256 timestamp,
    address anchorer
) pure returns (BlockInfo memory) {
    return
        BlockInfo({
            blockNumber: blockNumber,
            blockHash: blockHash,
            stateRoot: stateRoot,
            timestamp: timestamp,
            anchorer: anchorer
        });
}

interface IAnchoringCore {
    /**
     * @notice Emitted when a single block is anchored
     * @param blockNumber Block number that was anchored
     * @param blockHash Block hash
     * @param stateRoot State root of the block
     * @param chainId Chain ID of the external chain (EIP-155)
     * @param timestamp When the block was anchored
     * @param anchorer Address that performed the anchoring
     */
    event BlockAnchored(
        uint256 indexed blockNumber,
        bytes32 indexed blockHash,
        bytes32 stateRoot,
        uint256 chainId,
        uint256 timestamp,
        address indexed anchorer
    );

    /**
     * @notice Emitted when multiple blocks are anchored in a batch operation
     * @param chainId Chain ID of the external chain (EIP-155)
     * @param blockCount Number of blocks anchored in this batch
     * @param firstBlock First block number in the batch
     * @param lastBlock Last block number in the batch
     * @param timestamp When the batch was anchored
     * @param anchorer Address that performed the anchoring
     */
    event BlocksBatchAnchored(
        uint256 indexed chainId,
        uint256 blockCount,
        uint256 firstBlock,
        uint256 lastBlock,
        uint256 timestamp,
        address indexed anchorer
    );

    /**
     * @notice Emitted when a new chain is registered for anchoring
     * @param chainId Chain ID that was registered (EIP-155)
     * @param registrar Address that registered the chain
     */
    event ChainRegistered(uint256 indexed chainId, address indexed registrar);

    /// @notice Thrown when trying to anchor a block that's already anchored
    error BlockAlreadyAnchored(uint256 blockNumber);

    /// @notice Thrown when block number is not sequential
    error BlockNumberMustBeHigher(uint256 provided, uint256 required);

    /// @notice Thrown when querying a non-existent block
    error BlockNotFound(uint256 blockNumber);

    /// @notice Thrown when no blocks have been anchored yet
    error NoBlocksAnchored();

    /// @notice Thrown when invalid count parameter is provided
    error InvalidCount();

    /// @notice Thrown when trying to use an unregistered chain
    error ChainNotRegistered(uint256 chainId);

    /// @notice Thrown when trying to register an already registered chain
    error ChainAlreadyRegistered(uint256 chainId);

    /// @notice Thrown when invalid range is provided
    error InvalidRange();

    /// @notice Thrown when array lengths don't match in batch operations
    error ArrayLengthMismatch();

    /**
     * @notice Registers a new chain for anchoring
     * @param _chainId Chain ID to register (EIP-155)
     */
    function registerChain(uint256 _chainId) external;

    /**
     * @notice Anchors a single block from an external chain
     * @param _chainId Chain ID of the external chain (EIP-155)
     * @param _blockNumber Block number from external chain
     * @param _blockHash Block hash from external chain
     * @param _stateRoot State root from external chain
     */
    function anchorBlock(
        uint256 _chainId,
        uint256 _blockNumber,
        bytes32 _blockHash,
        bytes32 _stateRoot
    ) external;

    /**
     * @notice Anchors multiple blocks in a single transaction (batch operation)
     * @param _chainId Chain ID of the external chain (EIP-155)
     * @param _blockNumbers Array of block numbers
     * @param _blockHashes Array of block hashes
     * @param _stateRoots Array of state roots
     */
    function anchorBlocksBatch(
        uint256 _chainId,
        uint256[] calldata _blockNumbers,
        bytes32[] calldata _blockHashes,
        bytes32[] calldata _stateRoots
    ) external;

    /**
     * @notice Gets the last anchored block for a specific chain
     * @param _chainId Chain ID to query
     * @return BlockInfo struct with block details
     */
    function getLastAnchoredBlock(
        uint256 _chainId
    ) external view returns (BlockInfo memory);

    /**
     * @notice Gets information about a specific anchored block
     * @param _chainId Chain ID to query
     * @param _blockNumber Block number to query
     * @return BlockInfo struct with block details
     */
    function getAnchoredBlock(
        uint256 _chainId,
        uint256 _blockNumber
    ) external view returns (BlockInfo memory);

    /**
     * @notice Checks if a block has been anchored for a specific chain
     * @param _chainId Chain ID to check
     * @param _blockNumber Block number to check
     * @return True if block is anchored, false otherwise
     */
    function isBlockAnchored(
        uint256 _chainId,
        uint256 _blockNumber
    ) external view returns (bool);

    /**
     * @notice Gets the last N anchored blocks for a specific chain
     * @param _chainId Chain ID to query
     * @param _count Number of blocks to retrieve
     * @return Array of BlockInfo structs
     */
    function getLastNBlocks(
        uint256 _chainId,
        uint256 _count
    ) external view returns (BlockInfo[] memory);

    /**
     * @notice Gets blocks within a specific range for a specific chain
     * @param _chainId Chain ID to query
     * @param _fromBlock Starting block number
     * @param _toBlock Ending block number
     * @return Array of BlockInfo structs
     */
    function getBlocksInRange(
        uint256 _chainId,
        uint256 _fromBlock,
        uint256 _toBlock
    ) external view returns (BlockInfo[] memory);

    /**
     * @notice Gets system statistics for a specific chain
     * @param _chainId Chain ID to query
     * @return _totalAnchors Total number of anchored blocks
     * @return _lastAnchoredBlock Last anchored block number
     * @return _thisChainId Chain ID of this blockchain (EIP-155)
     * @return _anchoredChainId Chain ID being queried (EIP-155)
     */
    function getAnchoringStats(
        uint256 _chainId
    )
        external
        view
        returns (
            uint256 _totalAnchors,
            uint256 _lastAnchoredBlock,
            uint256 _thisChainId,
            uint256 _anchoredChainId
        );

    /**
     * @notice Gets chain metadata including all registered chains
     * @return _thisChainId Chain ID of this blockchain (EIP-155)
     * @return _registeredChainIds Array of all registered chain IDs
     */
    function getChainMetadata()
        external
        view
        returns (uint256 _thisChainId, uint256[] memory _registeredChainIds);

    /**
     * @notice Gets paginated list of registered chain IDs
     * @param _pageIndex Zero-based page index
     * @param _pageLength Number of items per page
     * @return _thisChainId Chain ID of this blockchain (EIP-155)
     * @return _registeredChainIds Paginated array of registered chain IDs
     */
    function getRegisteredChains(
        uint256 _pageIndex,
        uint256 _pageLength
    )
        external
        view
        returns (uint256 _thisChainId, uint256[] memory _registeredChainIds);
}
