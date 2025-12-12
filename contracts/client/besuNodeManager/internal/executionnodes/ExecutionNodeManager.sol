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

import {IExecutionNodeManager} from './IExecutionNodeManager.sol';
import {ExecutionNodeManagerInternal} from './ExecutionNodeManagerInternal.sol';
import {ExecutionNodeState, NodeDTO} from '../core/Types.sol';
import {_BESU_NODE_MANAGER_ROLE} from '../../../../constants/roles.sol';

/// @title ExecutionNodeManager
/// @notice Facade contract for execution node management with RBAC and pause protection
/// @dev All state-changing functions require BESU_NODE_MANAGER_ROLE and whenNotPaused
///      View functions do NOT require role or pause checks
///      Modifiers (whenNotPaused, onlyRole) will be provided by final Facet inheritance
abstract contract ExecutionNodeManager is
    IExecutionNodeManager,
    ExecutionNodeManagerInternal
{
    // ========== LIFECYCLE FUNCTIONS ==========

    /// @inheritdoc IExecutionNodeManager
    function addExecutionNode(
        string memory enode
    )
        external
        override
        whenNotPaused
        onlyRole(_BESU_NODE_MANAGER_ROLE)
        returns (bytes32 nodeId)
    {
        nodeId = _addExecutionNode(enode);
        emit ExecutionNodeAdded(
            nodeId,
            enode,
            _blockTimestamp(),
            ExecutionNodeState.active
        );
    }

    /// @inheritdoc IExecutionNodeManager
    function quarantineExecutionNode(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _quarantineExecutionNode(nodeId);
        emit ExecutionNodeQuarantined(nodeId);
    }

    /// @inheritdoc IExecutionNodeManager
    function unquarantineExecutionNode(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _unquarantineExecutionNode(nodeId);
        emit ExecutionNodeUnquarantined(nodeId);
    }

    /// @inheritdoc IExecutionNodeManager
    function removeExecutionNode(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _removeExecutionNode(nodeId);
        emit ExecutionNodeRemoved(nodeId);
    }

    // ========== VIEW FUNCTIONS (no RBAC or pause required) ==========

    /// @inheritdoc IExecutionNodeManager
    function getExecutionNodeState(
        bytes32 nodeId
    ) external view override returns (ExecutionNodeState) {
        return _getExecutionNodeState(nodeId);
    }

    /// @inheritdoc IExecutionNodeManager
    function isExecutionNode(
        bytes32 nodeId
    ) external view override returns (bool) {
        return _isExecutionNode(nodeId);
    }

    /// @inheritdoc IExecutionNodeManager
    function getTotalExecutionNodes(
        ExecutionNodeState state
    ) external view override returns (uint256) {
        return _getTotalExecutionNodes(state);
    }

    /// @inheritdoc IExecutionNodeManager
    function getPaginatedExecutionNodes(
        ExecutionNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view override returns (NodeDTO[] memory) {
        return _getPaginatedExecutionNodes(state, pageSize, pageIndex);
    }
}
