// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

import {BesuNodeManagerInternalCore} from '../core/BesuNodeManagerInternalCore.sol';
import {
    ValidatorState,
    ValidatorData,
    NodeDTO,
    _buildValidatorData,
    _buildNodeDTO
} from '../core/Types.sol';
import {_VALIDATOR_MANAGER_STORAGE_POSITION} from '../../../../constants/storagePositions.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {LibCommon} from '../../../../core/LibCommon.sol';

/// @title ValidatorManagerInternal
/// @notice Internal business logic for validator node management
/// @dev Inherits from BesuNodeManagerInternalCore for shared enode management
///      Manages validator-specific state, lifecycle, and pagination
abstract contract ValidatorManagerInternal is BesuNodeManagerInternalCore {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // ========== STORAGE STRUCT ==========

    /// @notice Storage structure for validator management
    /// @dev Uses dedicated storage position to avoid collisions
    ///      Packed data struct combines state + uint40 timestamp in single slot
    struct ValidatorManagerStorage {
        /// @notice Packed validator data (state + timestamp)
        mapping(bytes32 nodeId => ValidatorData validatorData) data;
        /// @notice EnumerableSets for O(1) pagination by state
        EnumerableSet.Bytes32Set activeValidators;
        EnumerableSet.Bytes32Set standbyValidators;
        EnumerableSet.Bytes32Set quarantinedValidators;
    }

    // ========== VALIDATOR LIFECYCLE FUNCTIONS ==========

    /// @notice Internal function to add a validator node
    /// @param enode The enode URL of the validator
    /// @param initialState The initial state (active or standby)
    /// @return nodeId The unique identifier of the added validator
    function _addValidator(
        string memory enode,
        ValidatorState initialState
    ) internal returns (bytes32 nodeId) {
        // Compute nodeId
        nodeId = keccak256(bytes(enode));

        // Register enode in core storage (handles validation and uniqueness)
        _registerEnode(nodeId, enode);

        // Store packed validator data
        ValidatorManagerStorage storage $ = _validatorStorage();
        $.data[nodeId] = _buildValidatorData(
            initialState,
            _validateAndGetTimestamp()
        );

        // Add to appropriate enumerable set for O(1) pagination
        initialState == ValidatorState.active
            ? $.activeValidators.add(nodeId)
            : $.standbyValidators.add(nodeId);
    }

    /// @notice Internal function to promote validator from standby to active
    /// @param nodeId The validator node ID
    function _promoteValidator(bytes32 nodeId) internal {
        _checkValidatorState(nodeId, ValidatorState.standby);

        ValidatorManagerStorage storage $ = _validatorStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = ValidatorState.active;
        $.standbyValidators.remove(nodeId);
        $.activeValidators.add(nodeId);
    }

    /// @notice Internal function to move validator from active to standby
    /// @param nodeId The validator node ID
    function _standbyValidator(bytes32 nodeId) internal {
        _checkValidatorState(nodeId, ValidatorState.active);

        ValidatorManagerStorage storage $ = _validatorStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = ValidatorState.standby;
        $.activeValidators.remove(nodeId);
        $.standbyValidators.add(nodeId);
    }

    /// @notice Internal function to quarantine validator (from standby)
    /// @param nodeId The validator node ID
    function _quarantineValidator(bytes32 nodeId) internal {
        _checkValidatorState(nodeId, ValidatorState.standby);

        ValidatorManagerStorage storage $ = _validatorStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = ValidatorState.quarantine;
        $.standbyValidators.remove(nodeId);
        $.quarantinedValidators.add(nodeId);
    }

    /// @notice Internal function to unquarantine validator (back to standby)
    /// @param nodeId The validator node ID
    function _unquarantineValidator(bytes32 nodeId) internal {
        _checkValidatorState(nodeId, ValidatorState.quarantine);

        ValidatorManagerStorage storage $ = _validatorStorage();

        // Update state atomically (timestamp unchanged, only 1 SSTORE)
        $.data[nodeId].state = ValidatorState.standby;
        $.quarantinedValidators.remove(nodeId);
        $.standbyValidators.add(nodeId);
    }

    /// @notice Internal function to remove validator
    /// @param nodeId The validator node ID
    function _removeValidator(bytes32 nodeId) internal {
        ValidatorManagerStorage storage $ = _validatorStorage();
        ValidatorState currentState = $.data[nodeId].state;

        _checkNodeRegistered(nodeId, uint8(currentState));

        // Remove from appropriate enumerable set
        currentState == ValidatorState.active
            ? $.activeValidators.remove(nodeId)
            : (currentState == ValidatorState.standby)
                ? $.standbyValidators.remove(nodeId)
                : $.quarantinedValidators.remove(nodeId);

        // Clear packed data
        delete $.data[nodeId];

        // Unregister enode from core storage
        _unregisterEnode(nodeId);
    }

    // ========== STATE VALIDATION FUNCTIONS ==========

    /// @notice Validates that validator is in expected state
    /// @dev Private function following _checkXXX naming pattern
    /// @param nodeId The validator node ID
    /// @param expectedState The expected state
    function _checkValidatorState(
        bytes32 nodeId,
        ValidatorState expectedState
    ) internal view {
        _checkState(
            nodeId,
            uint8(_validatorStorage().data[nodeId].state),
            uint8(expectedState)
        );
    }

    // ========== PAGINATION FUNCTIONS ==========

    /// @notice Internal function to get paginated validators by state
    /// @param state The state to filter by
    /// @param pageSize The number of items per page
    /// @param pageIndex The page index (1-based)
    /// @return nodes Array of NodeDTO structs for the requested page
    function _getPaginatedValidators(
        ValidatorState state,
        uint256 pageSize,
        uint256 pageIndex
    ) internal view returns (NodeDTO[] memory nodes) {
        if (state == ValidatorState.none) {
            return nodes;
        }
        EnumerableSet.Bytes32Set storage set = _getValidatorSet(state);
        (uint256 cursor, uint256 howMany, , ) = LibCommon
            .getPaginationParameters(set.length(), pageIndex, pageSize);

        nodes = new NodeDTO[](howMany);
        for (uint256 i; i < howMany; ) {
            nodes[i] = _getValidatorNode(set.at(cursor));
            unchecked {
                ++i;
                ++cursor;
            }
        }
    }

    function _getValidatorNode(
        bytes32 nodeId
    ) internal view returns (NodeDTO memory node_) {
        node_ = _buildNodeDTO(
            nodeId,
            _getEnode(nodeId),
            _validatorStorage().data[nodeId].timestamp
        );
    }

    // ========== QUERY FUNCTIONS ==========

    /// @notice Gets the state of a validator node
    /// @param nodeId The unique identifier of the validator
    /// @return The current state of the validator
    function _getValidatorState(
        bytes32 nodeId
    ) internal view returns (ValidatorState) {
        return _validatorStorage().data[nodeId].state;
    }

    /// @notice Checks if a node is a validator
    /// @param nodeId The unique identifier of the node
    /// @return True if the node is a validator, false otherwise
    function _isValidator(bytes32 nodeId) internal view returns (bool) {
        return _validatorStorage().data[nodeId].state != ValidatorState.none;
    }

    /// @notice Gets the total count of validators by state
    /// @param state The state to filter by
    /// @return count The total number of validators in the specified state
    function _getTotalValidators(
        ValidatorState state
    ) internal view returns (uint256 count) {
        return
            state == ValidatorState.none ? 0 : _getValidatorSet(state).length();
    }

    // ========== UTILITY FUNCTIONS ==========

    /// @notice Gets the enumerable set for a specific validator state
    /// @param state The validator state
    /// @return The corresponding enumerable set
    function _getValidatorSet(
        ValidatorState state
    ) private view returns (EnumerableSet.Bytes32Set storage) {
        ValidatorManagerStorage storage $ = _validatorStorage();
        return
            state == ValidatorState.active
                ? $.activeValidators
                : state == ValidatorState.standby
                    ? $.standbyValidators
                    : $.quarantinedValidators;
    }

    // ========== STORAGE ACCESSOR ==========

    /// @notice Returns the validator storage struct
    /// @dev Uses inline assembly to return storage struct at predefined slot
    /// @return $ The validator storage struct
    function _validatorStorage()
        private
        pure
        returns (ValidatorManagerStorage storage $)
    {
        bytes32 position = _VALIDATOR_MANAGER_STORAGE_POSITION;
        // slither-disable-start assembly
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := position
        }
        // slither-disable-end assembly
    }
}
