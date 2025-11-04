// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

import {NodeDTO} from './core/Types.sol';

/// @title IBesuNodeManagerCommon
/// @notice Interface for cross-category BesuNodeManager utility functions
/// @dev Provides functions that operate across all node categories (validators, boot nodes, execution nodes)
interface IBesuNodeManagerCommon {
    /**
     * @notice Returns the NodeDTO for a given ID across all categories
     * @dev Searches across validators, boot nodes, and execution nodes
     *      Returns the complete node information including nodeId, enode, and timestamp
     * @param nodeId The unique identifier of the node (keccak256 of enode)
     * @return node The NodeDTO containing nodeId, enode, and timestamp
     */
    function getNode(bytes32 nodeId) external view returns (NodeDTO memory);
}
