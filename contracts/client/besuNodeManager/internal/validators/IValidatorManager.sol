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

import {ValidatorState, NodeDTO} from '../core/Types.sol';

/**
 * @title IValidatorManager
 * @notice Interface for validator node management operations
 * @dev Defines lifecycle operations, state transitions, and query functions for validators
 */
interface IValidatorManager {
    // ========== EVENTS ==========

    /// @notice Emitted when a validator is added
    /// @param nodeId The unique identifier of the node
    /// @param enode The enode URL of the validator
    /// @param timestamp The timestamp when the validator was added
    /// @param initialState The initial state of the validator
    event ValidatorAdded(
        bytes32 indexed nodeId,
        string enode,
        uint256 timestamp,
        ValidatorState initialState
    );

    /// @notice Emitted when a validator is promoted from standby to active
    /// @param nodeId The unique identifier of the node
    event ValidatorPromoted(bytes32 indexed nodeId);

    /// @notice Emitted when a validator is moved to standby
    /// @param nodeId The unique identifier of the node
    event ValidatorStandby(bytes32 indexed nodeId);

    /// @notice Emitted when a validator is quarantined
    /// @param nodeId The unique identifier of the node
    event ValidatorQuarantined(bytes32 indexed nodeId);

    /// @notice Emitted when a validator is removed from quarantine
    /// @param nodeId The unique identifier of the node
    event ValidatorUnquarantined(bytes32 indexed nodeId);

    /// @notice Emitted when a validator is removed
    /// @param nodeId The unique identifier of the node
    event ValidatorRemoved(bytes32 indexed nodeId);

    // ========== LIFECYCLE FUNCTIONS ==========

    /**
     * @notice Adds a new validator node directly to the active state
     * @param enode The enode URL of the validator
     * @return nodeId The unique identifier of the added validator
     */
    function addValidator(string memory enode) external returns (bytes32);

    /**
     * @notice Adds a new validator node to the standby state
     * @param enode The enode URL of the validator
     * @return nodeId The unique identifier of the added validator
     */
    function addValidatorStandby(
        string memory enode
    ) external returns (bytes32);

    /**
     * @notice Promotes a validator from standby to active state
     * @param nodeId The unique identifier of the validator
     */
    function promoteValidator(bytes32 nodeId) external;

    /**
     * @notice Moves a validator from active to standby state
     * @param nodeId The unique identifier of the validator
     */
    function standbyValidator(bytes32 nodeId) external;

    /**
     * @notice Moves a validator from standby to quarantine state
     * @param nodeId The unique identifier of the validator
     */
    function quarantineValidator(bytes32 nodeId) external;

    /**
     * @notice Moves a validator from quarantine back to standby state
     * @param nodeId The unique identifier of the validator
     */
    function unquarantineValidator(bytes32 nodeId) external;

    /**
     * @notice Removes a validator node, setting its state back to none
     * @param nodeId The unique identifier of the validator
     */
    function removeValidator(bytes32 nodeId) external;

    // ========== QUERY FUNCTIONS ==========

    /**
     * @notice Gets the state of a validator node
     * @param nodeId The unique identifier of the validator
     * @return The current state of the validator
     */
    function getValidatorState(
        bytes32 nodeId
    ) external view returns (ValidatorState);

    /**
     * @notice Checks if a node is a validator
     * @param nodeId The unique identifier of the node
     * @return True if the node is a validator, false otherwise
     */
    function isValidator(bytes32 nodeId) external view returns (bool);

    // ========== PAGINATION FUNCTIONS ==========

    /**
     * @notice Gets the total count of validators by state
     * @param state The state to filter by (none returns 0, active/standby/quarantine return counts)
     * @return count The total number of validators in the specified state
     */
    function getTotalValidators(
        ValidatorState state
    ) external view returns (uint256 count);

    /**
     * @notice Gets a paginated list of validators filtered by state
     * @dev Uses 1-based page indexing. Returns empty array if state is none.
     * @param state The state to filter by
     * @param pageSize The number of items per page
     * @param pageIndex The page index (1-based)
     * @return nodes Array of NodeDTO structs for the requested page
     */
    function getPaginatedValidators(
        ValidatorState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view returns (NodeDTO[] memory nodes);
}
