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

import {IValidatorManager} from './IValidatorManager.sol';
import {ValidatorManagerInternal} from './ValidatorManagerInternal.sol';
import {ValidatorState, NodeDTO} from '../core/Types.sol';
import {_BESU_NODE_MANAGER_ROLE} from '../../../../constants/roles.sol';

/// @title ValidatorManager
/// @notice Facade contract for validator management with RBAC and pause protection
/// @dev All state-changing functions require BESU_NODE_MANAGER_ROLE and whenNotPaused
///      View functions do NOT require role or pause checks
///      Modifiers (whenNotPaused, onlyRole) will be provided by final Facet inheritance
abstract contract ValidatorManager is
    IValidatorManager,
    ValidatorManagerInternal
{
    // ========== LIFECYCLE FUNCTIONS ==========

    /// @inheritdoc IValidatorManager
    function addValidator(
        string memory enode
    )
        external
        override
        whenNotPaused
        onlyRole(_BESU_NODE_MANAGER_ROLE)
        returns (bytes32 nodeId)
    {
        nodeId = _addValidator(enode, ValidatorState.active);
        emit ValidatorAdded(
            nodeId,
            enode,
            _blockTimestamp(),
            ValidatorState.active
        );
    }

    /// @inheritdoc IValidatorManager
    function addValidatorStandby(
        string memory enode
    )
        external
        override
        whenNotPaused
        onlyRole(_BESU_NODE_MANAGER_ROLE)
        returns (bytes32 nodeId)
    {
        nodeId = _addValidator(enode, ValidatorState.standby);
        emit ValidatorAdded(
            nodeId,
            enode,
            _blockTimestamp(),
            ValidatorState.standby
        );
    }

    /// @inheritdoc IValidatorManager
    function promoteValidator(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _promoteValidator(nodeId);
        emit ValidatorPromoted(nodeId);
    }

    /// @inheritdoc IValidatorManager
    function standbyValidator(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _standbyValidator(nodeId);
        emit ValidatorStandby(nodeId);
    }

    /// @inheritdoc IValidatorManager
    function quarantineValidator(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _quarantineValidator(nodeId);
        emit ValidatorQuarantined(nodeId);
    }

    /// @inheritdoc IValidatorManager
    function unquarantineValidator(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _unquarantineValidator(nodeId);
        emit ValidatorUnquarantined(nodeId);
    }

    /// @inheritdoc IValidatorManager
    function removeValidator(
        bytes32 nodeId
    ) external override whenNotPaused onlyRole(_BESU_NODE_MANAGER_ROLE) {
        _removeValidator(nodeId);
        emit ValidatorRemoved(nodeId);
    }

    // ========== VIEW FUNCTIONS (no RBAC or pause required) ==========

    /// @inheritdoc IValidatorManager
    function getValidatorState(
        bytes32 nodeId
    ) external view override returns (ValidatorState) {
        return _getValidatorState(nodeId);
    }

    /// @inheritdoc IValidatorManager
    function isValidator(bytes32 nodeId) external view override returns (bool) {
        return _isValidator(nodeId);
    }

    /// @inheritdoc IValidatorManager
    function getTotalValidators(
        ValidatorState state
    ) external view override returns (uint256) {
        return _getTotalValidators(state);
    }

    /// @inheritdoc IValidatorManager
    function getPaginatedValidators(
        ValidatorState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view override returns (NodeDTO[] memory) {
        return _getPaginatedValidators(state, pageSize, pageIndex);
    }
}
