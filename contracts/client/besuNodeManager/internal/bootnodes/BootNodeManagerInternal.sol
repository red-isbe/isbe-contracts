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
    BootNodeState,
    BootNodeData,
    NodeDTO,
    _buildBootNodeData,
    _buildNodeDTO
} from '../core/Types.sol';
import {
    _BOOTNODE_MANAGER_STORAGE_POSITION
} from '../../../../constants/storagePositions.sol';
import {
    EnumerableSet
} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {LibCommon} from '../../../../core/LibCommon.sol';

/// @title BootNodeManagerInternal
/// @notice Internal business logic for boot node management
/// @dev Inherits from BesuNodeManagerInternalCore for shared enode management
///      Manages boot node-specific state, lifecycle, and pagination
abstract contract BootNodeManagerInternal is BesuNodeManagerInternalCore {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // ========== STORAGE STRUCT ==========

    /// @notice Storage structure for boot node management
    /// @dev Uses dedicated storage position to avoid collisions
    ///      Packed data struct combines state + uint40 timestamp in single slot
    struct BootNodeManagerStorage {
        /// @notice Packed boot node data (state + timestamp)
        mapping(bytes32 => BootNodeData) data;
        /// @notice EnumerableSets for O(1) pagination by state
        EnumerableSet.Bytes32Set activeBootNodes;
        EnumerableSet.Bytes32Set quarantinedBootNodes;
    }

    // ========== BOOT NODE LIFECYCLE FUNCTIONS ==========

    /// @notice Internal function to add a boot node
    /// @param enode The enode URL of the boot node
    /// @return nodeId The unique identifier of the added boot node
    function _addBootNode(
        string memory enode
    ) internal returns (bytes32 nodeId) {
        // Compute nodeId
        nodeId = keccak256(bytes(enode));

        // Register enode in core storage (handles validation and uniqueness)
        _registerEnode(nodeId, enode);

        // Store packed boot node data (always starts active)
        BootNodeManagerStorage storage $ = _bootNodeStorage();
        $.data[nodeId] = _buildBootNodeData(
            BootNodeState.active,
            _validateAndGetTimestamp()
        );

        // Add to active enumerable set
        $.activeBootNodes.add(nodeId);
    }

    /// @notice Internal function to quarantine boot node (from active)
    /// @param nodeId The boot node ID
    function _quarantineBootNode(bytes32 nodeId) internal {
        _checkBootNodeState(nodeId, BootNodeState.active);

        BootNodeManagerStorage storage $ = _bootNodeStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = BootNodeState.quarantine;
        $.activeBootNodes.remove(nodeId);
        $.quarantinedBootNodes.add(nodeId);
    }

    /// @notice Internal function to unquarantine boot node (back to active)
    /// @param nodeId The boot node ID
    function _unquarantineBootNode(bytes32 nodeId) internal {
        _checkBootNodeState(nodeId, BootNodeState.quarantine);

        BootNodeManagerStorage storage $ = _bootNodeStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = BootNodeState.active;
        $.quarantinedBootNodes.remove(nodeId);
        $.activeBootNodes.add(nodeId);
    }

    /// @notice Internal function to remove boot node
    /// @param nodeId The boot node ID
    function _removeBootNode(bytes32 nodeId) internal {
        BootNodeManagerStorage storage $ = _bootNodeStorage();
        BootNodeState currentState = $.data[nodeId].state;

        _checkNodeRegistered(nodeId, uint8(currentState));

        // Remove from appropriate enumerable set
        currentState == BootNodeState.active
            ? $.activeBootNodes.remove(nodeId)
            : $.quarantinedBootNodes.remove(nodeId);

        // Clear packed data
        delete $.data[nodeId];

        // Unregister enode from core storage
        _unregisterEnode(nodeId);
    }

    // ========== STATE VALIDATION FUNCTIONS ==========

    /// @notice Validates that boot node is in expected state
    /// @dev Private function following _checkXXX naming pattern
    /// @param nodeId The boot node ID
    /// @param expectedState The expected state
    function _checkBootNodeState(
        bytes32 nodeId,
        BootNodeState expectedState
    ) internal view {
        _checkState(
            nodeId,
            uint8(_bootNodeStorage().data[nodeId].state),
            uint8(expectedState)
        );
    }

    // ========== PAGINATION FUNCTIONS ==========

    /// @notice Internal function to get paginated boot nodes by state
    /// @param state The state to filter by
    /// @param pageSize The number of items per page
    /// @param pageIndex The page index (1-based)
    /// @return nodes Array of NodeDTO structs for the requested page
    function _getPaginatedBootNodes(
        BootNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) internal view returns (NodeDTO[] memory nodes) {
        if (state == BootNodeState.none) {
            return nodes;
        }

        EnumerableSet.Bytes32Set storage set = _getBootNodeSet(state);

        (uint256 cursor, uint256 howMany, , ) = LibCommon
            .getPaginationParameters(set.length(), pageIndex, pageSize);

        nodes = new NodeDTO[](howMany);
        for (uint256 i; i < howMany; ) {
            // Reconstruct NodeDTO from optimized storage
            nodes[i] = _getBootNode(set.at(cursor));
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _getBootNode(
        bytes32 nodeId
    ) internal view returns (NodeDTO memory node_) {
        node_ = _buildNodeDTO(
            nodeId,
            _getEnode(nodeId),
            _bootNodeStorage().data[nodeId].timestamp
        );
    }

    // ========== QUERY FUNCTIONS ==========

    /// @notice Gets the current state of a boot node
    /// @param nodeId The boot node ID
    /// @return The current state
    function _getBootNodeState(
        bytes32 nodeId
    ) internal view returns (BootNodeState) {
        return _bootNodeStorage().data[nodeId].state;
    }

    /// @notice Checks if a node is registered as a boot node
    /// @param nodeId The node ID to check
    /// @return True if registered as boot node
    function _isBootNode(bytes32 nodeId) internal view returns (bool) {
        return _bootNodeStorage().data[nodeId].state != BootNodeState.none;
    }

    /// @notice Gets total count of boot nodes in a specific state
    /// @param state The state to count
    /// @return The total count
    function _getTotalBootNodes(
        BootNodeState state
    ) internal view returns (uint256) {
        return _getBootNodeSet(state).length();
    }

    // ========== HELPER FUNCTIONS ==========

    /// @notice Gets the enumerable set for a specific boot node state
    /// @param state The boot node state
    /// @return The corresponding enumerable set
    function _getBootNodeSet(
        BootNodeState state
    ) private view returns (EnumerableSet.Bytes32Set storage) {
        BootNodeManagerStorage storage $ = _bootNodeStorage();
        return
            state == BootNodeState.active
                ? $.activeBootNodes
                : $.quarantinedBootNodes;
    }

    // ========== STORAGE ACCESSOR ==========

    /// @notice Returns the boot node storage struct
    /// @dev Uses inle assembly to return storage struct at predefined slot
    /// @return $ The boot node storage struct
    function _bootNodeStorage()
        private
        pure
        returns (BootNodeManagerStorage storage $)
    {
        bytes32 position = _BOOTNODE_MANAGER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := position
        }
        // slither-disable-end assembly
    }
}
