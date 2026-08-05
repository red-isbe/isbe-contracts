## IValidatorManager

Interface for validator node management operations

_Defines lifecycle operations, state transitions, and query functions for validators_

### ValidatorAdded

```solidity
event ValidatorAdded(bytes32 nodeId, string enode, uint256 timestamp, enum ValidatorState initialState)
```

Emitted when a validator is added

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |
| enode | string | The enode URL of the validator |
| timestamp | uint256 | The timestamp when the validator was added |
| initialState | enum ValidatorState | The initial state of the validator |

### ValidatorPromoted

```solidity
event ValidatorPromoted(bytes32 nodeId)
```

Emitted when a validator is promoted from standby to active

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorStandby

```solidity
event ValidatorStandby(bytes32 nodeId)
```

Emitted when a validator is moved to standby

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorQuarantined

```solidity
event ValidatorQuarantined(bytes32 nodeId)
```

Emitted when a validator is quarantined

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorUnquarantined

```solidity
event ValidatorUnquarantined(bytes32 nodeId)
```

Emitted when a validator is removed from quarantine

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorRemoved

```solidity
event ValidatorRemoved(bytes32 nodeId)
```

Emitted when a validator is removed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

### addValidator

```solidity
function addValidator(string enode) external returns (bytes32)
```

Adds a new validator node directly to the active state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | nodeId The unique identifier of the added validator |

### addValidatorStandby

```solidity
function addValidatorStandby(string enode) external returns (bytes32)
```

Adds a new validator node to the standby state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | nodeId The unique identifier of the added validator |

### promoteValidator

```solidity
function promoteValidator(bytes32 nodeId) external
```

Promotes a validator from standby to active state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### standbyValidator

```solidity
function standbyValidator(bytes32 nodeId) external
```

Moves a validator from active to standby state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### quarantineValidator

```solidity
function quarantineValidator(bytes32 nodeId) external
```

Moves a validator from standby to quarantine state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### unquarantineValidator

```solidity
function unquarantineValidator(bytes32 nodeId) external
```

Moves a validator from quarantine back to standby state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### removeValidator

```solidity
function removeValidator(bytes32 nodeId) external
```

Removes a validator node, setting its state back to none

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### getValidatorState

```solidity
function getValidatorState(bytes32 nodeId) external view returns (enum ValidatorState)
```

Gets the state of a validator node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum ValidatorState | The current state of the validator |

### isValidator

```solidity
function isValidator(bytes32 nodeId) external view returns (bool)
```

Checks if a node is a validator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the node is a validator, false otherwise |

### getTotalValidators

```solidity
function getTotalValidators(enum ValidatorState state) external view returns (uint256 count)
```

Gets the total count of validators by state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum ValidatorState | The state to filter by (none returns 0, active/standby/quarantine return counts) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The total number of validators in the specified state |

### getPaginatedValidators

```solidity
function getPaginatedValidators(enum ValidatorState state, uint256 pageSize, uint256 pageIndex) external view returns (struct NodeDTO[] nodes)
```

Gets a paginated list of validators filtered by state

_Uses 1-based page indexing. Returns empty array if state is none._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum ValidatorState | The state to filter by |
| pageSize | uint256 | The number of items per page |
| pageIndex | uint256 | The page index (1-based) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodes | struct NodeDTO[] | Array of NodeDTO structs for the requested page |



---

## ValidatorManager

Facade contract for validator management with RBAC and pause protection

_All state-changing functions require BESU_NODE_MANAGER_ROLE and whenNotPaused
     View functions do NOT require role or pause checks
     Modifiers (whenNotPaused, onlyRole) will be provided by final Facet inheritance_

### addValidator

```solidity
function addValidator(string enode) external returns (bytes32 nodeId)
```

Adds a new validator node directly to the active state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | nodeId The unique identifier of the added validator |

### addValidatorStandby

```solidity
function addValidatorStandby(string enode) external returns (bytes32 nodeId)
```

Adds a new validator node to the standby state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | nodeId The unique identifier of the added validator |

### promoteValidator

```solidity
function promoteValidator(bytes32 nodeId) external
```

Promotes a validator from standby to active state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### standbyValidator

```solidity
function standbyValidator(bytes32 nodeId) external
```

Moves a validator from active to standby state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### quarantineValidator

```solidity
function quarantineValidator(bytes32 nodeId) external
```

Moves a validator from standby to quarantine state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### unquarantineValidator

```solidity
function unquarantineValidator(bytes32 nodeId) external
```

Moves a validator from quarantine back to standby state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### removeValidator

```solidity
function removeValidator(bytes32 nodeId) external
```

Removes a validator node, setting its state back to none

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

### getValidatorState

```solidity
function getValidatorState(bytes32 nodeId) external view returns (enum ValidatorState)
```

Gets the state of a validator node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum ValidatorState | The current state of the validator |

### isValidator

```solidity
function isValidator(bytes32 nodeId) external view returns (bool)
```

Checks if a node is a validator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the node is a validator, false otherwise |

### getTotalValidators

```solidity
function getTotalValidators(enum ValidatorState state) external view returns (uint256)
```

Gets the total count of validators by state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum ValidatorState | The state to filter by (none returns 0, active/standby/quarantine return counts) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

### getPaginatedValidators

```solidity
function getPaginatedValidators(enum ValidatorState state, uint256 pageSize, uint256 pageIndex) external view returns (struct NodeDTO[])
```

Gets a paginated list of validators filtered by state

_Uses 1-based page indexing. Returns empty array if state is none._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum ValidatorState | The state to filter by |
| pageSize | uint256 | The number of items per page |
| pageIndex | uint256 | The page index (1-based) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeDTO[] |  |



---

## ValidatorManagerInternal

Internal business logic for validator node management

_Inherits from BesuNodeManagerInternalCore for shared enode management
     Manages validator-specific state, lifecycle, and pagination_

### ValidatorManagerStorage

Storage structure for validator management

_Uses dedicated storage position to avoid collisions
     Packed data struct combines state + uint40 timestamp in single slot_

```solidity
struct ValidatorManagerStorage {
  mapping(bytes32 => struct ValidatorData) data;
  struct EnumerableSet.Bytes32Set activeValidators;
  struct EnumerableSet.Bytes32Set standbyValidators;
  struct EnumerableSet.Bytes32Set quarantinedValidators;
}
```

### _addValidator

```solidity
function _addValidator(string enode, enum ValidatorState initialState) internal returns (bytes32 nodeId)
```

Internal function to add a validator node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| enode | string | The enode URL of the validator |
| initialState | enum ValidatorState | The initial state (active or standby) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the added validator |

### _promoteValidator

```solidity
function _promoteValidator(bytes32 nodeId) internal
```

Internal function to promote validator from standby to active

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The validator node ID |

### _standbyValidator

```solidity
function _standbyValidator(bytes32 nodeId) internal
```

Internal function to move validator from active to standby

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The validator node ID |

### _quarantineValidator

```solidity
function _quarantineValidator(bytes32 nodeId) internal
```

Internal function to quarantine validator (from standby)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The validator node ID |

### _unquarantineValidator

```solidity
function _unquarantineValidator(bytes32 nodeId) internal
```

Internal function to unquarantine validator (back to standby)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The validator node ID |

### _removeValidator

```solidity
function _removeValidator(bytes32 nodeId) internal
```

Internal function to remove validator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The validator node ID |

### _checkValidatorState

```solidity
function _checkValidatorState(bytes32 nodeId, enum ValidatorState expectedState) internal view
```

Validates that validator is in expected state

_Private function following _checkXXX naming pattern_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The validator node ID |
| expectedState | enum ValidatorState | The expected state |

### _getPaginatedValidators

```solidity
function _getPaginatedValidators(enum ValidatorState state, uint256 pageSize, uint256 pageIndex) internal view returns (struct NodeDTO[] nodes)
```

Internal function to get paginated validators by state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum ValidatorState | The state to filter by |
| pageSize | uint256 | The number of items per page |
| pageIndex | uint256 | The page index (1-based) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodes | struct NodeDTO[] | Array of NodeDTO structs for the requested page |

### _getValidatorNode

```solidity
function _getValidatorNode(bytes32 nodeId) internal view returns (struct NodeDTO node_)
```

### _getValidatorState

```solidity
function _getValidatorState(bytes32 nodeId) internal view returns (enum ValidatorState)
```

Gets the state of a validator node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the validator |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | enum ValidatorState | The current state of the validator |

### _isValidator

```solidity
function _isValidator(bytes32 nodeId) internal view returns (bool)
```

Checks if a node is a validator

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the node is a validator, false otherwise |

### _getTotalValidators

```solidity
function _getTotalValidators(enum ValidatorState state) internal view returns (uint256 count)
```

Gets the total count of validators by state

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| state | enum ValidatorState | The state to filter by |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | The total number of validators in the specified state |

