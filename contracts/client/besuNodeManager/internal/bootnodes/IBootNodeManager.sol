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
pragma solidity 0.8.28;

import {BootNodeState, NodeDTO} from '../core/Types.sol';

/// @title IBootNodeManager
/// @notice Interface for boot node lifecycle management
/// @dev Boot nodes support active and quarantine states only
interface IBootNodeManager {
    // ========== EVENTS ==========

    /// @notice Emitted when a boot node is added
    /// @param nodeId The unique node identifier (keccak256(enode))
    /// @param enode The enode URL
    /// @param timestamp The block timestamp when registered
    /// @param state The initial state (always active for boot nodes)
    event BootNodeAdded(
        bytes32 indexed nodeId,
        string enode,
        uint256 timestamp,
        BootNodeState state
    );

    /// @notice Emitted when a boot node is quarantined
    /// @param nodeId The node identifier
    event BootNodeQuarantined(bytes32 indexed nodeId);

    /// @notice Emitted when a boot node is unquarantined
    /// @param nodeId The node identifier
    event BootNodeUnquarantined(bytes32 indexed nodeId);

    /// @notice Emitted when a boot node is removed
    /// @param nodeId The node identifier
    event BootNodeRemoved(bytes32 indexed nodeId);

    // ========== LIFECYCLE FUNCTIONS ==========

    /// @notice Add a new boot node to the network
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Boot nodes are added directly to active state
    /// @param enode The enode URL of the boot node
    /// @return nodeId The unique identifier of the boot node
    function addBootNode(string memory enode) external returns (bytes32 nodeId);

    /// @notice Quarantine a boot node (from active)
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Can only quarantine active boot nodes
    /// @param nodeId The boot node identifier
    function quarantineBootNode(bytes32 nodeId) external;

    /// @notice Unquarantine a boot node (back to active)
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Can only unquarantine quarantined boot nodes
    /// @param nodeId The boot node identifier
    function unquarantineBootNode(bytes32 nodeId) external;

    /// @notice Remove a boot node from the network
    /// @dev Requires BESU_NODE_MANAGER_ROLE
    ///      Can remove from any state
    /// @param nodeId The boot node identifier
    function removeBootNode(bytes32 nodeId) external;

    // ========== VIEW FUNCTIONS ==========

    /// @notice Get the current state of a boot node
    /// @param nodeId The boot node identifier
    /// @return The current state of the boot node
    function getBootNodeState(
        bytes32 nodeId
    ) external view returns (BootNodeState);

    /// @notice Check if a node is registered as a boot node
    /// @param nodeId The node identifier to check
    /// @return True if the node is a boot node
    function isBootNode(bytes32 nodeId) external view returns (bool);

    /// @notice Get total count of boot nodes in a specific state
    /// @param state The state to count
    /// @return The total number of boot nodes in the given state
    function getTotalBootNodes(
        BootNodeState state
    ) external view returns (uint256);

    /// @notice Get paginated list of boot nodes by state
    /// @dev Uses 1-based pagination
    /// @param state The state to filter by
    /// @param pageSize The number of items per page
    /// @param pageIndex The page index (1-based)
    /// @return Array of NodeDTO structs containing nodeId, enode, and timestamp
    function getPaginatedBootNodes(
        BootNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view returns (NodeDTO[] memory);
}
