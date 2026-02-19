## BesuNodeManagerInternalCore

Core storage layer for managing enodes across all node categories

_Provides single source of truth for enode strings and cross-category uniqueness
     This is the base contract inherited by all specialized node managers
     Inherits from Common to provide access to modifiers (whenNotPaused, onlyRole)_

### BesuNodeManagerCoreStorage

Core storage structure for shared enode management

_Uses dedicated storage position to avoid collisions with Diamond storage
     All node categories (Validator, BootNode, ExecutionNode) share this mapping_

```solidity
struct BesuNodeManagerCoreStorage {
  mapping(bytes32 => string) enodes;
}
```

### _registerEnode

```solidity
function _registerEnode(bytes32 nodeId, string enode) internal
```

Registers an enode in core storage

_Called by specialized managers during node registration
     Ensures cross-category uniqueness_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier (keccak256 of enode) |
| enode | string | The enode string to register |

### _unregisterEnode

```solidity
function _unregisterEnode(bytes32 nodeId) internal
```

Unregisters an enode from core storage

_Called by specialized managers when removing a node_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier to unregister |

### _getEnode

```solidity
function _getEnode(bytes32 nodeId) internal view returns (string)
```

Gets the enode string for a node

_Returns empty string if node not found_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The enode string |

### _checkNodeNotRegistered

```solidity
function _checkNodeNotRegistered(bytes32 nodeId) internal view
```

Validates that node is not already registered in any category

_Private function following _checkXXX naming pattern_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node ID to check |

### _validateAndGetTimestamp

```solidity
function _validateAndGetTimestamp() internal view returns (uint40 timestamp)
```

Validates that block.timestamp fits in uint40

_Throws TimestampOverflow if timestamp exceeds uint40 max (year 36,812)
     This is a safety check, extremely unlikely to occur in practice_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| timestamp | uint40 | The current block timestamp as uint40 |

### _isNodeRegistered

```solidity
function _isNodeRegistered(bytes32 nodeId) internal view returns (bool)
```

Checks if a node is registered in any category

_A node is registered if its enode exists in core storage_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node ID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the node exists in any category |

### _checkNodeRegistered

```solidity
function _checkNodeRegistered(bytes32 _nodeId, uint8 _currentState) internal pure
```

### _checkState

```solidity
function _checkState(bytes32 nodeId, uint8 currentState, uint8 expectedState) internal pure
```

