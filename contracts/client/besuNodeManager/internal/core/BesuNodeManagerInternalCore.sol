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
    EmptyEnode,
    NodeNotFound,
    NodeAlreadyRegistered,
    TimestampOverflow,
    InvalidStateTransition
} from './Types.sol';
import {_BESU_NODE_MANAGER_CORE_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
import {DidDocumentDetailedInternal} from '../../../../identity/didregistry/DidDocumentDetailedInternal.sol';

/// @title BesuNodeManagerInternalCore
/// @notice Core storage layer for managing enodes across all node categories
/// @dev Provides single source of truth for enode strings and cross-category uniqueness
///      This is the base contract inherited by all specialized node managers
///      Inherits from Common to provide access to modifiers (whenNotPaused, onlyRole)
abstract contract BesuNodeManagerInternalCore is DidDocumentDetailedInternal {
    // ========== STORAGE STRUCT ==========

    /// @notice Core storage structure for shared enode management
    /// @dev Uses dedicated storage position to avoid collisions with Diamond storage
    ///      All node categories (Validator, BootNode, ExecutionNode) share this mapping
    struct BesuNodeManagerCoreStorage {
        /// @notice Shared enode mapping (single source of truth)
        /// @dev nodeId = keccak256(enode)
        ///      Storing enode once eliminates duplication across categories
        mapping(bytes32 => string) enodes;
    }

    // ========== SHARED ENODE MANAGEMENT ==========

    /// @notice Registers an enode in core storage
    /// @dev Called by specialized managers during node registration
    ///      Ensures cross-category uniqueness
    /// @param nodeId The unique identifier (keccak256 of enode)
    /// @param enode The enode string to register
    function _registerEnode(bytes32 nodeId, string memory enode) internal {
        _checkEnodeNotEmpty(enode);
        _checkNodeNotRegistered(nodeId);

        BesuNodeManagerCoreStorage storage $ = _coreStorage();
        $.enodes[nodeId] = enode;
    }

    /// @notice Unregisters an enode from core storage
    /// @dev Called by specialized managers when removing a node
    /// @param nodeId The unique identifier to unregister
    function _unregisterEnode(bytes32 nodeId) internal {
        delete _coreStorage().enodes[nodeId];
    }

    /// @notice Gets the enode string for a node
    /// @dev Returns empty string if node not found
    /// @param nodeId The unique identifier of the node
    /// @return The enode string
    function _getEnode(bytes32 nodeId) internal view returns (string memory) {
        return _coreStorage().enodes[nodeId];
    }

    // ========== BASE VALIDATION FUNCTIONS ==========

    /// @notice Validates that node is not already registered in any category
    /// @dev Private function following _checkXXX naming pattern
    /// @param nodeId The node ID to check
    function _checkNodeNotRegistered(bytes32 nodeId) internal view {
        require(!_isNodeRegistered(nodeId), NodeAlreadyRegistered(nodeId));
    }

    // ========== UTILITY FUNCTIONS ==========

    /// @notice Validates that block.timestamp fits in uint40
    /// @dev Throws TimestampOverflow if timestamp exceeds uint40 max (year 36,812)
    ///      This is a safety check, extremely unlikely to occur in practice
    /// @return timestamp The current block timestamp as uint40
    function _validateAndGetTimestamp()
        internal
        view
        returns (uint40 timestamp)
    {
        require(_blockTimestamp() <= type(uint40).max, TimestampOverflow());
        return uint40(_blockTimestamp());
    }

    /// @notice Checks if a node is registered in any category
    /// @dev A node is registered if its enode exists in core storage
    /// @param nodeId The node ID to check
    /// @return True if the node exists in any category
    function _isNodeRegistered(bytes32 nodeId) internal view returns (bool) {
        return bytes(_coreStorage().enodes[nodeId]).length > 0;
    }

    function _checkNodeRegistered(
        bytes32 _nodeId,
        uint8 _currentState
    ) internal pure {
        require(_currentState != 0, NodeNotFound(_nodeId));
    }

    function _checkState(
        bytes32 nodeId,
        uint8 currentState,
        uint8 expectedState
    ) internal pure {
        require(
            currentState == expectedState,
            InvalidStateTransition(nodeId, currentState, expectedState)
        );
    }

    /// @notice Validates that enode is not empty
    /// @dev Private function following _checkXXX naming pattern
    /// @param enode The enode string to validate
    function _checkEnodeNotEmpty(string memory enode) private pure {
        require(bytes(enode).length > 0, EmptyEnode());
    }

    // ========== STORAGE ACCESSOR ==========

    /// @notice Returns the core storage struct
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return $ The core storage struct
    function _coreStorage()
        private
        pure
        returns (BesuNodeManagerCoreStorage storage $)
    {
        bytes32 position = _BESU_NODE_MANAGER_CORE_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := position
        }
        // slither-disable-end assembly
    }
}
