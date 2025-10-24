// SPDX-License-Identifier: ISC
pragma solidity 0.8.28;

/**
 * @title IBesuNodeManager
 * @notice Interface for managing Hyperledger Besu network nodes
 * @dev Manages three categories of nodes: Validators, Boot Nodes, and Execution Nodes
 */
interface IBesuNodeManager {
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

    /// @notice Structure representing a node in the network
    struct Node {
        string enode; // The enode URL of the node
        bytes32 id; // Keccak256 hash of the enode for unique identification
        uint256 timestamp; // Unix timestamp of when the node was added
    }

    // ========== VALIDATOR EVENTS ==========

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

    // ========== BOOT NODE EVENTS ==========

    /// @notice Emitted when a boot node is added
    /// @param nodeId The unique identifier of the node
    /// @param enode The enode URL of the boot node
    /// @param timestamp The timestamp when the boot node was added
    event BootNodeAdded(
        bytes32 indexed nodeId,
        string enode,
        uint256 timestamp
    );

    /// @notice Emitted when a boot node is quarantined
    /// @param nodeId The unique identifier of the node
    event BootNodeQuarantined(bytes32 indexed nodeId);

    /// @notice Emitted when a boot node is removed from quarantine
    /// @param nodeId The unique identifier of the node
    event BootNodeUnquarantined(bytes32 indexed nodeId);

    /// @notice Emitted when a boot node is removed
    /// @param nodeId The unique identifier of the node
    event BootNodeRemoved(bytes32 indexed nodeId);

    // ========== EXECUTION NODE EVENTS ==========

    /// @notice Emitted when an execution node is added
    /// @param nodeId The unique identifier of the node
    /// @param enode The enode URL of the execution node
    /// @param timestamp The timestamp when the execution node was added
    event ExecutionNodeAdded(
        bytes32 indexed nodeId,
        string enode,
        uint256 timestamp
    );

    /// @notice Emitted when an execution node is quarantined
    /// @param nodeId The unique identifier of the node
    event ExecutionNodeQuarantined(bytes32 indexed nodeId);

    /// @notice Emitted when an execution node is removed from quarantine
    /// @param nodeId The unique identifier of the node
    event ExecutionNodeUnquarantined(bytes32 indexed nodeId);

    /// @notice Emitted when an execution node is removed
    /// @param nodeId The unique identifier of the node
    event ExecutionNodeRemoved(bytes32 indexed nodeId);

    // ========== VALIDATOR FUNCTIONS ==========

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

    // ========== BOOT NODE FUNCTIONS ==========

    /**
     * @notice Adds a new boot node to the active state
     * @param enode The enode URL of the boot node
     * @return nodeId The unique identifier of the added boot node
     */
    function addBootNode(string memory enode) external returns (bytes32);

    /**
     * @notice Moves a boot node from active to quarantine state
     * @param nodeId The unique identifier of the boot node
     */
    function quarantineBootNode(bytes32 nodeId) external;

    /**
     * @notice Moves a boot node from quarantine back to active state
     * @param nodeId The unique identifier of the boot node
     */
    function unquarantineBootNode(bytes32 nodeId) external;

    /**
     * @notice Removes a boot node, setting its state back to none
     * @param nodeId The unique identifier of the boot node
     */
    function removeBootNode(bytes32 nodeId) external;

    // ========== EXECUTION NODE FUNCTIONS ==========

    /**
     * @notice Adds a new execution node to the active state
     * @param enode The enode URL of the execution node
     * @return nodeId The unique identifier of the added execution node
     */
    function addExecutionNode(string memory enode) external returns (bytes32);

    /**
     * @notice Moves an execution node from active to quarantine state
     * @param nodeId The unique identifier of the execution node
     */
    function quarantineExecutionNode(bytes32 nodeId) external;

    /**
     * @notice Moves an execution node from quarantine back to active state
     * @param nodeId The unique identifier of the execution node
     */
    function unquarantineExecutionNode(bytes32 nodeId) external;

    /**
     * @notice Removes an execution node, setting its state back to none
     * @param nodeId The unique identifier of the execution node
     */
    function removeExecutionNode(bytes32 nodeId) external;

    // ========== UTILITY FUNCTIONS ==========

    /**
     * @notice Returns the Node struct for a given ID across all categories
     * @param nodeId The unique identifier of the node
     * @return node The Node struct containing enode, id, and timestamp
     */
    function getNode(bytes32 nodeId) external view returns (Node memory);

    /**
     * @notice Checks if a node is a validator
     * @param nodeId The unique identifier of the node
     * @return True if the node is a validator, false otherwise
     */
    function isValidator(bytes32 nodeId) external view returns (bool);

    /**
     * @notice Checks if a node is a boot node
     * @param nodeId The unique identifier of the node
     * @return True if the node is a boot node, false otherwise
     */
    function isBootNode(bytes32 nodeId) external view returns (bool);

    /**
     * @notice Checks if a node is an execution node
     * @param nodeId The unique identifier of the node
     * @return True if the node is an execution node, false otherwise
     */
    function isExecutionNode(bytes32 nodeId) external view returns (bool);

    /**
     * @notice Gets the state of a validator node
     * @param nodeId The unique identifier of the validator
     * @return The current state of the validator
     */
    function getValidatorState(
        bytes32 nodeId
    ) external view returns (ValidatorState);

    /**
     * @notice Gets the state of a boot node
     * @param nodeId The unique identifier of the boot node
     * @return The current state of the boot node
     */
    function getBootNodeState(
        bytes32 nodeId
    ) external view returns (BootNodeState);

    /**
     * @notice Gets the state of an execution node
     * @param nodeId The unique identifier of the execution node
     * @return The current state of the execution node
     */
    function getExecutionNodeState(
        bytes32 nodeId
    ) external view returns (ExecutionNodeState);

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
     * @notice Gets the total count of boot nodes by state
     * @param state The state to filter by (none returns 0, active/quarantine return counts)
     * @return count The total number of boot nodes in the specified state
     */
    function getTotalBootNodes(
        BootNodeState state
    ) external view returns (uint256 count);

    /**
     * @notice Gets the total count of execution nodes by state
     * @param state The state to filter by (none returns 0, active/quarantine return counts)
     * @return count The total number of execution nodes in the specified state
     */
    function getTotalExecutionNodes(
        ExecutionNodeState state
    ) external view returns (uint256 count);

    /**
     * @notice Gets a paginated list of validators filtered by state
     * @dev Uses 1-based page indexing. Returns empty array if state is none.
     * @param state The state to filter by
     * @param pageSize The number of items per page
     * @param pageIndex The page index (1-based)
     * @return nodes Array of Node structs for the requested page
     */
    function getPaginatedValidators(
        ValidatorState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view returns (Node[] memory nodes);

    /**
     * @notice Gets a paginated list of boot nodes filtered by state
     * @dev Uses 1-based page indexing. Returns empty array if state is none.
     * @param state The state to filter by
     * @param pageSize The number of items per page
     * @param pageIndex The page index (1-based)
     * @return nodes Array of Node structs for the requested page
     */
    function getPaginatedBootNodes(
        BootNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view returns (Node[] memory nodes);

    /**
     * @notice Gets a paginated list of execution nodes filtered by state
     * @dev Uses 1-based page indexing. Returns empty array if state is none.
     * @param state The state to filter by
     * @param pageSize The number of items per page
     * @param pageIndex The page index (1-based)
     * @return nodes Array of Node structs for the requested page
     */
    function getPaginatedExecutionNodes(
        ExecutionNodeState state,
        uint256 pageSize,
        uint256 pageIndex
    ) external view returns (Node[] memory nodes);
}
