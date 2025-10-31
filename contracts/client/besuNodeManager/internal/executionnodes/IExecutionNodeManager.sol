// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

import {ExecutionNodeState, NodeDTO} from '../core/Types.sol';

/// @title IExecutionNodeManager
/// @notice Interface for execution node lifecycle management
/// @dev Execution nodes support active and quarantine states only
interface IExecutionNodeManager {
    // ========== EVENTS ==========

    /// @notice Emitted when an execution node is added
    /// @param nodeId The unique node identifier (keccak256(enode))
    /// @param enode The enode URL
    /// @param timestamp The block timestamp when registered
    /// @param state The initial state (always active for execution nodes)
    event ExecutionNodeAdded(
        bytes32 indexed nodeId,
        string enode,
        uint256 timestamp,
        ExecutionNodeState state
    );

    /// @notice Emitted when an execution node is quarantined
    /// @param nodeId The node identifier
    event ExecutionNodeQuarantined(bytes32 indexed nodeId);

    /// @notice Emitted when an execution node is unquarantined
    /// @param nodeId The node identifier
    event ExecutionNodeUnquarantined(bytes32 indexed nodeId);

    /// @notice Emitted when an execution node is removed
    /// @param nodeId The node identifier
    event ExecutionNodeRemoved(bytes32 indexed nodeId);

    // ========== LIFECYCLE FUNCTIONS ==========

    /// @notice Add a new execution node to the network
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Execution nodes are added directly to active state
    /// @param enode The enode URL of the execution node
    /// @return nodeId The unique identifier of the execution node
    function addExecutionNode(
        string memory enode
    ) external returns (bytes32 nodeId);

    /// @notice Quarantine an execution node (from active)
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Can only quarantine active execution nodes
    /// @param nodeId The execution node identifier
    function quarantineExecutionNode(bytes32 nodeId) external;

    /// @notice Unquarantine an execution node (back to active)
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Can only unquarantine quarantined execution nodes
    /// @param nodeId The execution node identifier
    function unquarantineExecutionNode(bytes32 nodeId) external;

    /// @notice Remove an execution node from the network
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Can remove from any state
    /// @param nodeId The execution node identifier
    function removeExecutionNode(bytes32 nodeId) external;

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get the current state of an execution node
    /// @param nodeId The execution node identifier
    /// @return The current state of the execution node
    function getExecutionNodeState(
        bytes32 nodeId
    ) external view returns (ExecutionNodeState);

    /// @notice Check if a node is registered as an execution node
    /// @param nodeId The node identifier to check
    /// @return True if the node is an execution node
    function isExecutionNode(bytes32 nodeId) external view returns (bool);

    /// @notice Get total count of execution nodes in a specific state
    /// @param state The state to count
    /// @return The total number of execution nodes in the given state
    function getTotalExecutionNodes(
        ExecutionNodeState state
    ) external view returns (uint256);

    /// @notice Get paginated list of execution nodes by state
    /// @dev Uses 1-based pagination
    /// @param state The state to filter by
    /// @param pageSize The number of items per page
    /// @param pageIndex The page index (1-based)
    /// @return Array of NodeDTO structs containing nodeId, enode, and timestamp
    function getPaginatedExecutionNodes(
        ExecutionNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view returns (NodeDTO[] memory);
}
