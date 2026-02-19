## BootNodeManager

Facade contract for boot node management with RBAC and pause protection

_All state-changing functions require BESU_NODE_MANAGER_ROLE and whenNotPaused
     View functions do NOT require role or pause checks
     Modifiers (whenNotPaused, onlyRole) will be provided by final Facet inheritance_

### addBootNode

```solidity
function addBootNode(string enode) external returns (bytes32 nodeId)
```

Add a new boot node to the network

_Requires BESU_NODE_MANAGER_ROLE
     Boot nodes are added directly to active state_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the boot node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the boot node |

### quarantineBootNode

```solidity
function quarantineBootNode(bytes32 nodeId) external
```

Quarantine a boot node (from active)

_Requires BESU_NODE_MANAGER_ROLE
     Can only quarantine active boot nodes_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

### unquarantineBootNode

```solidity
function unquarantineBootNode(bytes32 nodeId) external
```

Unquarantine a boot node (back to active)

_Requires BESU_NODE_MANAGER_ROLE
     Can only unquarantine quarantined boot nodes_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

### removeBootNode

```solidity
function removeBootNode(bytes32 nodeId) external
```

Remove a boot node from the network

_Requires BESU_NODE_MANAGER_ROLE
     Can remove from any state_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

### getBootNodeState

```solidity
function getBootNodeState(bytes32 nodeId) external view returns (enum BootNodeState)
```

Get the current state of a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum BootNodeState | The current state of the boot node |

### isBootNode

```solidity
function isBootNode(bytes32 nodeId) external view returns (bool)
```

Check if a node is registered as a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node identifier to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the node is a boot node |

### getTotalBootNodes

```solidity
function getTotalBootNodes(enum BootNodeState state) external view returns (uint256)
```

Get total count of boot nodes in a specific state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum BootNodeState | The state to count |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of boot nodes in the given state |

### getPaginatedBootNodes

```solidity
function getPaginatedBootNodes(enum BootNodeState state, uint256 pageSize, uint256 pageIndex) external view returns (struct NodeDTO[])
```

Get paginated list of boot nodes by state

_Uses 1-based pagination_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum BootNodeState | The state to filter by |
| pageSize | uint256 | The number of items per page |
| pageIndex | uint256 | The page index (1-based) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeDTO[] | Array of NodeDTO structs containing nodeId, enode, and timestamp |



---

## BootNodeManagerInternal

Internal business logic for boot node management

_Inherits from BesuNodeManagerInternalCore for shared enode management
     Manages boot node-specific state, lifecycle, and pagination_

### BootNodeManagerStorage

Storage structure for boot node management

_Uses dedicated storage position to avoid collisions
     Packed data struct combines state + uint40 timestamp in single slot_

```solidity
struct BootNodeManagerStorage {
  mapping(bytes32 => struct BootNodeData) data;
  struct EnumerableSet.Bytes32Set activeBootNodes;
  struct EnumerableSet.Bytes32Set quarantinedBootNodes;
}
```

### _addBootNode

```solidity
function _addBootNode(string enode) internal returns (bytes32 nodeId)
```

Internal function to add a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the boot node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the added boot node |

### _quarantineBootNode

```solidity
function _quarantineBootNode(bytes32 nodeId) internal
```

Internal function to quarantine boot node (from active)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node ID |

### _unquarantineBootNode

```solidity
function _unquarantineBootNode(bytes32 nodeId) internal
```

Internal function to unquarantine boot node (back to active)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node ID |

### _removeBootNode

```solidity
function _removeBootNode(bytes32 nodeId) internal
```

Internal function to remove boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node ID |

### _checkBootNodeState

```solidity
function _checkBootNodeState(bytes32 nodeId, enum BootNodeState expectedState) internal view
```

Validates that boot node is in expected state

_Private function following _checkXXX naming pattern_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node ID |
| expectedState | enum BootNodeState | The expected state |

### _getPaginatedBootNodes

```solidity
function _getPaginatedBootNodes(enum BootNodeState state, uint256 pageSize, uint256 pageIndex) internal view returns (struct NodeDTO[] nodes)
```

Internal function to get paginated boot nodes by state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum BootNodeState | The state to filter by |
| pageSize | uint256 | The number of items per page |
| pageIndex | uint256 | The page index (1-based) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodes | struct NodeDTO[] | Array of NodeDTO structs for the requested page |

### _getBootNode

```solidity
function _getBootNode(bytes32 nodeId) internal view returns (struct NodeDTO node_)
```

### _getBootNodeState

```solidity
function _getBootNodeState(bytes32 nodeId) internal view returns (enum BootNodeState)
```

Gets the current state of a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum BootNodeState | The current state |

### _isBootNode

```solidity
function _isBootNode(bytes32 nodeId) internal view returns (bool)
```

Checks if a node is registered as a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node ID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if registered as boot node |

### _getTotalBootNodes

```solidity
function _getTotalBootNodes(enum BootNodeState state) internal view returns (uint256)
```

Gets total count of boot nodes in a specific state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum BootNodeState | The state to count |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total count |



---

## IBootNodeManager

Interface for boot node lifecycle management

_Boot nodes support active and quarantine states only_

### BootNodeAdded

```solidity
event BootNodeAdded(bytes32 nodeId, string enode, uint256 timestamp, enum BootNodeState state)
```

Emitted when a boot node is added

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique node identifier (keccak256(enode)) |
| enode | string | The enode URL |
| timestamp | uint256 | The block timestamp when registered |
| state | enum BootNodeState | The initial state (always active for boot nodes) |

### BootNodeQuarantined

```solidity
event BootNodeQuarantined(bytes32 nodeId)
```

Emitted when a boot node is quarantined

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node identifier |

### BootNodeUnquarantined

```solidity
event BootNodeUnquarantined(bytes32 nodeId)
```

Emitted when a boot node is unquarantined

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node identifier |

### BootNodeRemoved

```solidity
event BootNodeRemoved(bytes32 nodeId)
```

Emitted when a boot node is removed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node identifier |

### addBootNode

```solidity
function addBootNode(string enode) external returns (bytes32 nodeId)
```

Add a new boot node to the network

_Requires BESU_NODE_MANAGER_ROLE
     Boot nodes are added directly to active state_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the boot node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the boot node |

### quarantineBootNode

```solidity
function quarantineBootNode(bytes32 nodeId) external
```

Quarantine a boot node (from active)

_Requires BESU_NODE_MANAGER_ROLE
     Can only quarantine active boot nodes_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

### unquarantineBootNode

```solidity
function unquarantineBootNode(bytes32 nodeId) external
```

Unquarantine a boot node (back to active)

_Requires BESU_NODE_MANAGER_ROLE
     Can only unquarantine quarantined boot nodes_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

### removeBootNode

```solidity
function removeBootNode(bytes32 nodeId) external
```

Remove a boot node from the network

_Requires BESU_NODE_MANAGER_ROLE
     Can remove from any state_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

### getBootNodeState

```solidity
function getBootNodeState(bytes32 nodeId) external view returns (enum BootNodeState)
```

Get the current state of a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The boot node identifier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum BootNodeState | The current state of the boot node |

### isBootNode

```solidity
function isBootNode(bytes32 nodeId) external view returns (bool)
```

Check if a node is registered as a boot node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node identifier to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the node is a boot node |

### getTotalBootNodes

```solidity
function getTotalBootNodes(enum BootNodeState state) external view returns (uint256)
```

Get total count of boot nodes in a specific state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum BootNodeState | The state to count |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of boot nodes in the given state |

### getPaginatedBootNodes

```solidity
function getPaginatedBootNodes(enum BootNodeState state, uint256 pageSize, uint256 pageIndex) external view returns (struct NodeDTO[])
```

Get paginated list of boot nodes by state

_Uses 1-based pagination_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum BootNodeState | The state to filter by |
| pageSize | uint256 | The number of items per page |
| pageIndex | uint256 | The page index (1-based) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeDTO[] | Array of NodeDTO structs containing nodeId, enode, and timestamp |

