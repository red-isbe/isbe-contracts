// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

/// @title Types
/// @notice Shared types, structs, enums, and errors for BesuNodeManager
/// @dev Used across all BesuNodeManager layers (Core, Validator, BootNode, ExecutionNode)
///      All definitions are public for external use

/// @notice Possible states for validator nodes
enum ValidatorState {
    none, // Not registered
    active, // Validated and actively validating
    standby, // Permissioned but not validating
    quarantine // Quarantined, not validating or permissioned
}

/// @notice Possible states for boot nodes
enum BootNodeState {
    none, // Not registered
    active, // Operational
    quarantine // Quarantined
}

/// @notice Possible states for execution nodes
enum ExecutionNodeState {
    none, // Not registered
    active, // Operational
    quarantine // Quarantined
}

/// @notice DTO structure for returning node data (with nodeId)
/// @dev Used in getter functions to return complete node information including the nodeId
struct NodeDTO {
    bytes32 nodeId; // The unique identifier (keccak256 of enode)
    string enode; // The enode URL of the node
    uint256 timestamp; // Unix timestamp of when the node was added
}

/// @notice Packed validator data for gas optimization
/// @dev Combines state and timestamp in a single storage slot
///      uint8 (1 byte) + uint40 (5 bytes) = 6 bytes, fits in 32-byte slot
struct ValidatorData {
    ValidatorState state; // uint8 - current state
    uint40 timestamp; // uint40 - registration timestamp (valid until year 36,812)
}

/// @notice Packed boot node data for gas optimization
/// @dev Combines state and timestamp in a single storage slot
struct BootNodeData {
    BootNodeState state; // uint8 - current state
    uint40 timestamp; // uint40 - registration timestamp
}

/// @notice Packed execution node data for gas optimization
/// @dev Combines state and timestamp in a single storage slot
struct ExecutionNodeData {
    ExecutionNodeState state; // uint8 - current state
    uint40 timestamp; // uint40 - registration timestamp
}

/// @notice Thrown when an empty enode string is provided
error EmptyEnode();

/// @notice Thrown when attempting to register a node that already exists
/// @param nodeId The ID of the node that is already registered
error NodeAlreadyRegistered(bytes32 nodeId);

/// @notice Thrown when a node is not found
/// @param nodeId The ID of the node that was not found
error NodeNotFound(bytes32 nodeId);

/// @notice Thrown when an invalid state transition is attempted
/// @param nodeId The ID of the node
/// @param currentState The current state of the node
/// @param targetState The target state that was attempted
error InvalidStateTransition(
    bytes32 nodeId,
    uint8 currentState,
    uint8 targetState
);

/// @notice Thrown if block.timestamp exceeds uint40 max value (year 36,812)
/// @dev This is a safety check, extremely unlikely to occur in practice
error TimestampOverflow();

/// @notice Builds a ValidatorData struct from state and timestamp
/// @dev Pure function for creating packed validator data
/// @param state The validator state
/// @param timestamp The timestamp (uint40)
/// @return The ValidatorData struct
function _buildValidatorData(
    ValidatorState state,
    uint40 timestamp
) pure returns (ValidatorData memory) {
    return ValidatorData({state: state, timestamp: timestamp});
}

/// @notice Builds a BootNodeData struct from state and timestamp
/// @dev Pure function for creating packed boot node data
/// @param state The boot node state
/// @param timestamp The timestamp (uint40)
/// @return The BootNodeData struct
function _buildBootNodeData(
    BootNodeState state,
    uint40 timestamp
) pure returns (BootNodeData memory) {
    return BootNodeData({state: state, timestamp: timestamp});
}

/// @notice Builds an ExecutionNodeData struct from state and timestamp
/// @dev Pure function for creating packed execution node data
/// @param state The execution node state
/// @param timestamp The timestamp (uint40)
/// @return The ExecutionNodeData struct
function _buildExecutionNodeData(
    ExecutionNodeState state,
    uint40 timestamp
) pure returns (ExecutionNodeData memory) {
    return ExecutionNodeData({state: state, timestamp: timestamp});
}

/// @notice Builds a NodeDTO struct from nodeId, enode, and timestamp
/// @dev Pure function for creating NodeDTO for external APIs
/// @param nodeId The unique identifier (keccak256 of enode)
/// @param enode The enode URL
/// @param timestamp The timestamp (expanded to uint256)
/// @return The NodeDTO struct
function _buildNodeDTO(
    bytes32 nodeId,
    string memory enode,
    uint256 timestamp
) pure returns (NodeDTO memory) {
    return NodeDTO({nodeId: nodeId, enode: enode, timestamp: timestamp});
}
