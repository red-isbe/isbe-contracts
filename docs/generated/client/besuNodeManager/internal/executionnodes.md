## ExecutionNodeManager

Facade contract for execution node management with RBAC and pause protection

_All state-changing functions require BESU_NODE_MANAGER_ROLE and whenNotPaused
View functions do NOT require role or pause checks
Modifiers (whenNotPaused, onlyRole) will be provided by final Facet inheritance_

### addExecutionNode

```solidity
function addExecutionNode(string enode) external returns (bytes32 nodeId)
```

Add a new execution node to the network

_Requires BESU_NODE_MANAGER_ROLE
Execution nodes are added directly to active state_

#### Parameters

| Name  | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| enode | string | The enode URL of the execution node |

#### Return Values

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the execution node |

### quarantineExecutionNode

```solidity
function quarantineExecutionNode(bytes32 nodeId) external
```

Quarantine an execution node (from active)

_Requires BESU_NODE_MANAGER_ROLE
Can only quarantine active execution nodes_

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

### unquarantineExecutionNode

```solidity
function unquarantineExecutionNode(bytes32 nodeId) external
```

Unquarantine an execution node (back to active)

_Requires BESU_NODE_MANAGER_ROLE
Can only unquarantine quarantined execution nodes_

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

### removeExecutionNode

```solidity
function removeExecutionNode(bytes32 nodeId) external
```

Remove an execution node from the network

_Requires BESU_NODE_MANAGER_ROLE
Can remove from any state_

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

### getExecutionNodeState

```solidity
function getExecutionNodeState(bytes32 nodeId) external view returns (enum ExecutionNodeState)
```

Get the current state of an execution node

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

#### Return Values

| Name | Type                    | Description                             |
| ---- | ----------------------- | --------------------------------------- |
| [0]  | enum ExecutionNodeState | The current state of the execution node |

### isExecutionNode

```solidity
function isExecutionNode(bytes32 nodeId) external view returns (bool)
```

Check if a node is registered as an execution node

#### Parameters

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| nodeId | bytes32 | The node identifier to check |

#### Return Values

| Name | Type | Description                           |
| ---- | ---- | ------------------------------------- |
| [0]  | bool | True if the node is an execution node |

### getTotalExecutionNodes

```solidity
function getTotalExecutionNodes(enum ExecutionNodeState state) external view returns (uint256)
```

Get total count of execution nodes in a specific state

#### Parameters

| Name  | Type                    | Description        |
| ----- | ----------------------- | ------------------ |
| state | enum ExecutionNodeState | The state to count |

#### Return Values

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| [0]  | uint256 | The total number of execution nodes in the given state |

### getPaginatedExecutionNodes

```solidity
function getPaginatedExecutionNodes(enum ExecutionNodeState state, uint256 pageSize, uint256 pageIndex) external view returns (struct NodeDTO[])
```

Get paginated list of execution nodes by state

_Uses 1-based pagination_

#### Parameters

| Name      | Type                    | Description                  |
| --------- | ----------------------- | ---------------------------- |
| state     | enum ExecutionNodeState | The state to filter by       |
| pageSize  | uint256                 | The number of items per page |
| pageIndex | uint256                 | The page index (1-based)     |

#### Return Values

| Name | Type             | Description                                                      |
| ---- | ---------------- | ---------------------------------------------------------------- |
| [0]  | struct NodeDTO[] | Array of NodeDTO structs containing nodeId, enode, and timestamp |

---

## ExecutionNodeManagerInternal

Internal business logic for execution node management

_Inherits from BesuNodeManagerInternalCore for shared enode management
Manages execution node-specific state, lifecycle, and pagination_

### ExecutionNodeManagerStorage

Storage structure for execution node management

_Uses dedicated storage position to avoid collisions
Packed data struct combines state + uint40 timestamp in single slot_

```solidity
struct ExecutionNodeManagerStorage {
  mapping(bytes32 => struct ExecutionNodeData) data;
  struct EnumerableSet.Bytes32Set activeExecutionNodes;
  struct EnumerableSet.Bytes32Set quarantinedExecutionNodes;
}
```

### \_addExecutionNode

```solidity
function _addExecutionNode(string enode) internal returns (bytes32 nodeId)
```

Internal function to add an execution node

#### Parameters

| Name  | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| enode | string | The enode URL of the execution node |

#### Return Values

| Name   | Type    | Description                                       |
| ------ | ------- | ------------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the added execution node |

### \_quarantineExecutionNode

```solidity
function _quarantineExecutionNode(bytes32 nodeId) internal
```

Internal function to quarantine execution node (from active)

#### Parameters

| Name   | Type    | Description           |
| ------ | ------- | --------------------- |
| nodeId | bytes32 | The execution node ID |

### \_unquarantineExecutionNode

```solidity
function _unquarantineExecutionNode(bytes32 nodeId) internal
```

Internal function to unquarantine execution node (back to active)

#### Parameters

| Name   | Type    | Description           |
| ------ | ------- | --------------------- |
| nodeId | bytes32 | The execution node ID |

### \_removeExecutionNode

```solidity
function _removeExecutionNode(bytes32 nodeId) internal
```

Internal function to remove execution node

#### Parameters

| Name   | Type    | Description           |
| ------ | ------- | --------------------- |
| nodeId | bytes32 | The execution node ID |

### \_checkExecutionNodeState

```solidity
function _checkExecutionNodeState(bytes32 nodeId, enum ExecutionNodeState expectedState) internal view
```

Validates that execution node is in expected state

_Private function following \_checkXXX naming pattern_

#### Parameters

| Name          | Type                    | Description           |
| ------------- | ----------------------- | --------------------- |
| nodeId        | bytes32                 | The execution node ID |
| expectedState | enum ExecutionNodeState | The expected state    |

### \_getPaginatedExecutionNodes

```solidity
function _getPaginatedExecutionNodes(enum ExecutionNodeState state, uint256 pageSize, uint256 pageIndex) internal view returns (struct NodeDTO[] nodes)
```

Internal function to get paginated execution nodes by state

#### Parameters

| Name      | Type                    | Description                  |
| --------- | ----------------------- | ---------------------------- |
| state     | enum ExecutionNodeState | The state to filter by       |
| pageSize  | uint256                 | The number of items per page |
| pageIndex | uint256                 | The page index (1-based)     |

#### Return Values

| Name  | Type             | Description                                     |
| ----- | ---------------- | ----------------------------------------------- |
| nodes | struct NodeDTO[] | Array of NodeDTO structs for the requested page |

### \_getExecutionNode

```solidity
function _getExecutionNode(bytes32 nodeId) internal view returns (struct NodeDTO node_)
```

### \_getExecutionNodeState

```solidity
function _getExecutionNodeState(bytes32 nodeId) internal view returns (enum ExecutionNodeState)
```

Gets the current state of an execution node

#### Parameters

| Name   | Type    | Description           |
| ------ | ------- | --------------------- |
| nodeId | bytes32 | The execution node ID |

#### Return Values

| Name | Type                    | Description       |
| ---- | ----------------------- | ----------------- |
| [0]  | enum ExecutionNodeState | The current state |

### \_isExecutionNode

```solidity
function _isExecutionNode(bytes32 nodeId) internal view returns (bool)
```

Checks if a node is registered as an execution node

#### Parameters

| Name   | Type    | Description          |
| ------ | ------- | -------------------- |
| nodeId | bytes32 | The node ID to check |

#### Return Values

| Name | Type | Description                          |
| ---- | ---- | ------------------------------------ |
| [0]  | bool | True if registered as execution node |

### \_getTotalExecutionNodes

```solidity
function _getTotalExecutionNodes(enum ExecutionNodeState state) internal view returns (uint256)
```

Gets total count of execution nodes in a specific state

#### Parameters

| Name  | Type                    | Description        |
| ----- | ----------------------- | ------------------ |
| state | enum ExecutionNodeState | The state to count |

#### Return Values

| Name | Type    | Description     |
| ---- | ------- | --------------- |
| [0]  | uint256 | The total count |

---

## IExecutionNodeManager

Interface for execution node lifecycle management

_Execution nodes support active and quarantine states only_

### ExecutionNodeAdded

```solidity
event ExecutionNodeAdded(bytes32 nodeId, string enode, uint256 timestamp, enum ExecutionNodeState state)
```

Emitted when an execution node is added

#### Parameters

| Name      | Type                    | Description                                           |
| --------- | ----------------------- | ----------------------------------------------------- |
| nodeId    | bytes32                 | The unique node identifier (keccak256(enode))         |
| enode     | string                  | The enode URL                                         |
| timestamp | uint256                 | The block timestamp when registered                   |
| state     | enum ExecutionNodeState | The initial state (always active for execution nodes) |

### ExecutionNodeQuarantined

```solidity
event ExecutionNodeQuarantined(bytes32 nodeId)
```

Emitted when an execution node is quarantined

#### Parameters

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| nodeId | bytes32 | The node identifier |

### ExecutionNodeUnquarantined

```solidity
event ExecutionNodeUnquarantined(bytes32 nodeId)
```

Emitted when an execution node is unquarantined

#### Parameters

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| nodeId | bytes32 | The node identifier |

### ExecutionNodeRemoved

```solidity
event ExecutionNodeRemoved(bytes32 nodeId)
```

Emitted when an execution node is removed

#### Parameters

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| nodeId | bytes32 | The node identifier |

### addExecutionNode

```solidity
function addExecutionNode(string enode) external returns (bytes32 nodeId)
```

Add a new execution node to the network

_Requires BESU_NODE_MANAGER_ROLE
Execution nodes are added directly to active state_

#### Parameters

| Name  | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| enode | string | The enode URL of the execution node |

#### Return Values

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the execution node |

### quarantineExecutionNode

```solidity
function quarantineExecutionNode(bytes32 nodeId) external
```

Quarantine an execution node (from active)

_Requires BESU_NODE_MANAGER_ROLE
Can only quarantine active execution nodes_

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

### unquarantineExecutionNode

```solidity
function unquarantineExecutionNode(bytes32 nodeId) external
```

Unquarantine an execution node (back to active)

_Requires BESU_NODE_MANAGER_ROLE
Can only unquarantine quarantined execution nodes_

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

### removeExecutionNode

```solidity
function removeExecutionNode(bytes32 nodeId) external
```

Remove an execution node from the network

_Requires BESU_NODE_MANAGER_ROLE
Can remove from any state_

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

### getExecutionNodeState

```solidity
function getExecutionNodeState(bytes32 nodeId) external view returns (enum ExecutionNodeState)
```

Get the current state of an execution node

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| nodeId | bytes32 | The execution node identifier |

#### Return Values

| Name | Type                    | Description                             |
| ---- | ----------------------- | --------------------------------------- |
| [0]  | enum ExecutionNodeState | The current state of the execution node |

### isExecutionNode

```solidity
function isExecutionNode(bytes32 nodeId) external view returns (bool)
```

Check if a node is registered as an execution node

#### Parameters

| Name   | Type    | Description                  |
| ------ | ------- | ---------------------------- |
| nodeId | bytes32 | The node identifier to check |

#### Return Values

| Name | Type | Description                           |
| ---- | ---- | ------------------------------------- |
| [0]  | bool | True if the node is an execution node |

### getTotalExecutionNodes

```solidity
function getTotalExecutionNodes(enum ExecutionNodeState state) external view returns (uint256)
```

Get total count of execution nodes in a specific state

#### Parameters

| Name  | Type                    | Description        |
| ----- | ----------------------- | ------------------ |
| state | enum ExecutionNodeState | The state to count |

#### Return Values

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| [0]  | uint256 | The total number of execution nodes in the given state |

### getPaginatedExecutionNodes

```solidity
function getPaginatedExecutionNodes(enum ExecutionNodeState state, uint256 pageSize, uint256 pageIndex) external view returns (struct NodeDTO[])
```

Get paginated list of execution nodes by state

_Uses 1-based pagination_

#### Parameters

| Name      | Type                    | Description                  |
| --------- | ----------------------- | ---------------------------- |
| state     | enum ExecutionNodeState | The state to filter by       |
| pageSize  | uint256                 | The number of items per page |
| pageIndex | uint256                 | The page index (1-based)     |

#### Return Values

| Name | Type             | Description                                                      |
| ---- | ---------------- | ---------------------------------------------------------------- |
| [0]  | struct NodeDTO[] | Array of NodeDTO structs containing nodeId, enode, and timestamp |
