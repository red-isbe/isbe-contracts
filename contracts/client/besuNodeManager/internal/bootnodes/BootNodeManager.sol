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

import {IBootNodeManager} from './IBootNodeManager.sol';
import {BootNodeManagerInternal} from './BootNodeManagerInternal.sol';
import {BootNodeState, NodeDTO} from '../core/Types.sol';
import {_BESU_NODE_MANAGER_ROLE} from '../../../../constants/roles.sol';

/// @title BootNodeManager
/// @notice Facade contract for boot node management with RBAC and pause protection
/// @dev All state-changing functions require BESU_NODE_MANAGER_ROLE and whenNotPaused
///      View functions do NOT require role or pause checks
///      Modifiers (whenNotPaused, onlyRole) will be provided by final Facet inheritance
abstract contract BootNodeManager is IBootNodeManager, BootNodeManagerInternal {
    // ========== LIFECYCLE FUNCTIONS ==========

    /// @inheritdoc IBootNodeManager
    function addBootNode(
        string memory enode
    )
        external
        override
        whenNotPaused
        onlyRole(_BESU_NODE_MANAGER_ROLE)
        returns (bytes32 nodeId)
    {
        nodeId = _addBootNode(enode);
        emit BootNodeAdded(
            nodeId,
            enode,
            _blockTimestamp(),
            BootNodeState.active
        );
    }

    /// @inheritdoc IBootNodeManager
    function quarantineBootNode(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _quarantineBootNode(nodeId);
        emit BootNodeQuarantined(nodeId);
    }

    /// @inheritdoc IBootNodeManager
    function unquarantineBootNode(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _unquarantineBootNode(nodeId);
        emit BootNodeUnquarantined(nodeId);
    }

    /// @inheritdoc IBootNodeManager
    function removeBootNode(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _removeBootNode(nodeId);
        emit BootNodeRemoved(nodeId);
    }

    // ========== VIEW FUNCTIONS (no RBAC or pause required) ==========

    /// @inheritdoc IBootNodeManager
    function getBootNodeState(
        bytes32 nodeId
    ) external view override returns (BootNodeState) {
        return _getBootNodeState(nodeId);
    }

    /// @inheritdoc IBootNodeManager
    function isBootNode(bytes32 nodeId) external view override returns (bool) {
        return _isBootNode(nodeId);
    }

    /// @inheritdoc IBootNodeManager
    function getTotalBootNodes(
        BootNodeState state
    ) external view override returns (uint256) {
        return _getTotalBootNodes(state);
    }

    /// @inheritdoc IBootNodeManager
    function getPaginatedBootNodes(
        BootNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view override returns (NodeDTO[] memory) {
        return _getPaginatedBootNodes(state, pageSize, pageIndex);
    }
}
