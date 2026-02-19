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

import {
    BesuNodeManagerInternalCore
} from '../core/BesuNodeManagerInternalCore.sol';
import {
    ExecutionNodeState,
    ExecutionNodeData,
    NodeDTO,
    _buildExecutionNodeData,
    _buildNodeDTO
} from '../core/Types.sol';
import {
    _EXECUTION_NODE_MANAGER_STORAGE_POSITION
} from '../../../../constants/storagePositions.sol';
import {
    EnumerableSet
} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {LibCommon} from '../../../../core/LibCommon.sol';

/// @title ExecutionNodeManagerInternal
/// @notice Internal business logic for execution node management
/// @dev Inherits from BesuNodeManagerInternalCore for shared enode management
///      Manages execution node-specific state, lifecycle, and pagination
abstract contract ExecutionNodeManagerInternal is BesuNodeManagerInternalCore {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // ========== STORAGE STRUCT ==========

    /// @notice Storage structure for execution node management
    /// @dev Uses dedicated storage position to avoid collisions
    ///      Packed data struct combines state + uint40 timestamp in single slot
    struct ExecutionNodeManagerStorage {
        /// @notice Packed execution node data (state + timestamp)
        mapping(bytes32 => ExecutionNodeData) data;
        /// @notice EnumerableSets for O(1) pagination by state
        EnumerableSet.Bytes32Set activeExecutionNodes;
        EnumerableSet.Bytes32Set quarantinedExecutionNodes;
    }

    // ========== EXECUTION NODE LIFECYCLE FUNCTIONS ==========

    /// @notice Internal function to add an execution node
    /// @param enode The enode URL of the execution node
    /// @return nodeId The unique identifier of the added execution node
    function _addExecutionNode(
        string memory enode
    ) internal returns (bytes32 nodeId) {
        // Compute nodeId
        nodeId = keccak256(bytes(enode));

        // Register enode in core storage (handles validation and uniqueness)
        _registerEnode(nodeId, enode);

        // Store packed execution node data (always starts active)
        ExecutionNodeManagerStorage storage $ = _executionNodeStorage();
        $.data[nodeId] = _buildExecutionNodeData(
            ExecutionNodeState.active,
            _validateAndGetTimestamp()
        );

        // Add to active enumerable set
        $.activeExecutionNodes.add(nodeId);
    }

    /// @notice Internal function to quarantine execution node (from active)
    /// @param nodeId The execution node ID
    function _quarantineExecutionNode(bytes32 nodeId) internal {
        _checkExecutionNodeState(nodeId, ExecutionNodeState.active);

        ExecutionNodeManagerStorage storage $ = _executionNodeStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = ExecutionNodeState.quarantine;
        $.activeExecutionNodes.remove(nodeId);
        $.quarantinedExecutionNodes.add(nodeId);
    }

    /// @notice Internal function to unquarantine execution node (back to active)
    /// @param nodeId The execution node ID
    function _unquarantineExecutionNode(bytes32 nodeId) internal {
        _checkExecutionNodeState(nodeId, ExecutionNodeState.quarantine);

        ExecutionNodeManagerStorage storage $ = _executionNodeStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = ExecutionNodeState.active;
        $.quarantinedExecutionNodes.remove(nodeId);
        $.activeExecutionNodes.add(nodeId);
    }

    /// @notice Internal function to remove execution node
    /// @param nodeId The execution node ID
    function _removeExecutionNode(bytes32 nodeId) internal {
        ExecutionNodeManagerStorage storage $ = _executionNodeStorage();
        ExecutionNodeState currentState = $.data[nodeId].state;

        _checkNodeRegistered(nodeId, uint8(currentState));

        // Remove from appropriate enumerable set
        currentState == ExecutionNodeState.active
            ? $.activeExecutionNodes.remove(nodeId)
            : $.quarantinedExecutionNodes.remove(nodeId);

        // Clear packed data
        delete $.data[nodeId];

        // Unregister enode from core storage
        _unregisterEnode(nodeId);
    }

    // ========== STATE VALIDATION FUNCTIONS ==========

    /// @notice Validates that execution node is in expected state
    /// @dev Private function following _checkXXX naming pattern
    /// @param nodeId The execution node ID
    /// @param expectedState The expected state
    function _checkExecutionNodeState(
        bytes32 nodeId,
        ExecutionNodeState expectedState
    ) internal view {
        _checkState(
            nodeId,
            uint8(_executionNodeStorage().data[nodeId].state),
            uint8(expectedState)
        );
    }

    // ========== PAGINATION FUNCTIONS ==========

    /// @notice Internal function to get paginated execution nodes by state
    /// @param state The state to filter by
    /// @param pageSize The number of items per page
    /// @param pageIndex The page index (1-based)
    /// @return nodes Array of NodeDTO structs for the requested page
    function _getPaginatedExecutionNodes(
        ExecutionNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) internal view returns (NodeDTO[] memory nodes) {
        if (state == ExecutionNodeState.none) {
            return nodes;
        }

        EnumerableSet.Bytes32Set storage set = _getExecutionNodeSet(state);

        (uint256 cursor, uint256 howMany, , ) = LibCommon
            .getPaginationParameters(set.length(), pageIndex, pageSize);

        nodes = new NodeDTO[](howMany);
        for (uint256 i; i < howMany; ) {
            // Reconstruct NodeDTO from optimized storage
            nodes[i] = _getExecutionNode(set.at(cursor));
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _getExecutionNode(
        bytes32 nodeId
    ) internal view returns (NodeDTO memory node_) {
        node_ = _buildNodeDTO(
            nodeId,
            _getEnode(nodeId),
            _executionNodeStorage().data[nodeId].timestamp
        );
    }

    // ========== QUERY FUNCTIONS ==========

    /// @notice Gets the current state of an execution node
    /// @param nodeId The execution node ID
    /// @return The current state
    function _getExecutionNodeState(
        bytes32 nodeId
    ) internal view returns (ExecutionNodeState) {
        return _executionNodeStorage().data[nodeId].state;
    }

    /// @notice Checks if a node is registered as an execution node
    /// @param nodeId The node ID to check
    /// @return True if registered as execution node
    function _isExecutionNode(bytes32 nodeId) internal view returns (bool) {
        return
            _executionNodeStorage().data[nodeId].state !=
            ExecutionNodeState.none;
    }

    /// @notice Gets total count of execution nodes in a specific state
    /// @param state The state to count
    /// @return The total count
    function _getTotalExecutionNodes(
        ExecutionNodeState state
    ) internal view returns (uint256) {
        return _getExecutionNodeSet(state).length();
    }

    // ========== HELPER FUNCTIONS ==========

    /// @notice Gets the enumerable set for a specific execution node state
    /// @param state The execution node state
    /// @return The corresponding enumerable set
    function _getExecutionNodeSet(
        ExecutionNodeState state
    ) private view returns (EnumerableSet.Bytes32Set storage) {
        ExecutionNodeManagerStorage storage $ = _executionNodeStorage();
        return
            state == ExecutionNodeState.active
                ? $.activeExecutionNodes
                : $.quarantinedExecutionNodes;
    }

    // ========== STORAGE ACCESSOR ==========

    /// @notice Returns the execution node storage struct
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return $ The execution node storage struct
    function _executionNodeStorage()
        private
        pure
        returns (ExecutionNodeManagerStorage storage $)
    {
        bytes32 position = _EXECUTION_NODE_MANAGER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := position
        }
        // slither-disable-end assembly
    }
}
