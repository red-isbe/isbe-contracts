## IBesuNodeManager

Interface for managing Hyperledger Besu network nodes

_Manages three categories of nodes: Validators, Boot Nodes, and Execution Nodes_

### ValidatorState

Possible states for validator nodes

```solidity
enum ValidatorState {
    none,
    active,
    standby,
    quarantine
}
```

### BootNodeState

Possible states for boot nodes

```solidity
enum BootNodeState {
    none,
    active,
    quarantine
}
```

### ExecutionNodeState

Possible states for execution nodes

```solidity
enum ExecutionNodeState {
    none,
    active,
    quarantine
}
```

### Node

Structure representing a node in the network

```solidity
struct Node {
    string enode;
    bytes32 id;
    uint256 timestamp;
}
```

### ValidatorAdded

```solidity
event ValidatorAdded(bytes32 nodeId, string enode, uint256 timestamp, enum IBesuNodeManager.ValidatorState initialState)
```

Emitted when a validator is added

#### Parameters

| Name         | Type                                 | Description                                |
| ------------ | ------------------------------------ | ------------------------------------------ |
| nodeId       | bytes32                              | The unique identifier of the node          |
| enode        | string                               | The enode URL of the validator             |
| timestamp    | uint256                              | The timestamp when the validator was added |
| initialState | enum IBesuNodeManager.ValidatorState | The initial state of the validator         |

### ValidatorPromoted

```solidity
event ValidatorPromoted(bytes32 nodeId)
```

Emitted when a validator is promoted from standby to active

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorStandby

```solidity
event ValidatorStandby(bytes32 nodeId)
```

Emitted when a validator is moved to standby

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorQuarantined

```solidity
event ValidatorQuarantined(bytes32 nodeId)
```

Emitted when a validator is quarantined

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorUnquarantined

```solidity
event ValidatorUnquarantined(bytes32 nodeId)
```

Emitted when a validator is removed from quarantine

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ValidatorRemoved

```solidity
event ValidatorRemoved(bytes32 nodeId)
```

Emitted when a validator is removed

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### BootNodeAdded

```solidity
event BootNodeAdded(bytes32 nodeId, string enode, uint256 timestamp)
```

Emitted when a boot node is added

#### Parameters

| Name      | Type    | Description                                |
| --------- | ------- | ------------------------------------------ |
| nodeId    | bytes32 | The unique identifier of the node          |
| enode     | string  | The enode URL of the boot node             |
| timestamp | uint256 | The timestamp when the boot node was added |

### BootNodeQuarantined

```solidity
event BootNodeQuarantined(bytes32 nodeId)
```

Emitted when a boot node is quarantined

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### BootNodeUnquarantined

```solidity
event BootNodeUnquarantined(bytes32 nodeId)
```

Emitted when a boot node is removed from quarantine

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### BootNodeRemoved

```solidity
event BootNodeRemoved(bytes32 nodeId)
```

Emitted when a boot node is removed

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ExecutionNodeAdded

```solidity
event ExecutionNodeAdded(bytes32 nodeId, string enode, uint256 timestamp)
```

Emitted when an execution node is added

#### Parameters

| Name      | Type    | Description                                     |
| --------- | ------- | ----------------------------------------------- |
| nodeId    | bytes32 | The unique identifier of the node               |
| enode     | string  | The enode URL of the execution node             |
| timestamp | uint256 | The timestamp when the execution node was added |

### ExecutionNodeQuarantined

```solidity
event ExecutionNodeQuarantined(bytes32 nodeId)
```

Emitted when an execution node is quarantined

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ExecutionNodeUnquarantined

```solidity
event ExecutionNodeUnquarantined(bytes32 nodeId)
```

Emitted when an execution node is removed from quarantine

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### ExecutionNodeRemoved

```solidity
event ExecutionNodeRemoved(bytes32 nodeId)
```

Emitted when an execution node is removed

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

### addValidator

```solidity
function addValidator(string enode) external returns (bytes32)
```

Adds a new validator node directly to the active state

#### Parameters

| Name  | Type   | Description                    |
| ----- | ------ | ------------------------------ |
| enode | string | The enode URL of the validator |

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | bytes32 | nodeId The unique identifier of the added validator |

### addValidatorStandby

```solidity
function addValidatorStandby(string enode) external returns (bytes32)
```

Adds a new validator node to the standby state

#### Parameters

| Name  | Type   | Description                    |
| ----- | ------ | ------------------------------ |
| enode | string | The enode URL of the validator |

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | bytes32 | nodeId The unique identifier of the added validator |

### promoteValidator

```solidity
function promoteValidator(bytes32 nodeId) external
```

Promotes a validator from standby to active state

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the validator |

### standbyValidator

```solidity
function standbyValidator(bytes32 nodeId) external
```

Moves a validator from active to standby state

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the validator |

### quarantineValidator

```solidity
function quarantineValidator(bytes32 nodeId) external
```

Moves a validator from standby to quarantine state

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the validator |

### unquarantineValidator

```solidity
function unquarantineValidator(bytes32 nodeId) external
```

Moves a validator from quarantine back to standby state

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the validator |

### removeValidator

```solidity
function removeValidator(bytes32 nodeId) external
```

Removes a validator node, setting its state back to none

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the validator |

### addBootNode

```solidity
function addBootNode(string enode) external returns (bytes32)
```

Adds a new boot node to the active state

#### Parameters

| Name  | Type   | Description                    |
| ----- | ------ | ------------------------------ |
| enode | string | The enode URL of the boot node |

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | bytes32 | nodeId The unique identifier of the added boot node |

### quarantineBootNode

```solidity
function quarantineBootNode(bytes32 nodeId) external
```

Moves a boot node from active to quarantine state

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the boot node |

### unquarantineBootNode

```solidity
function unquarantineBootNode(bytes32 nodeId) external
```

Moves a boot node from quarantine back to active state

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the boot node |

### removeBootNode

```solidity
function removeBootNode(bytes32 nodeId) external
```

Removes a boot node, setting its state back to none

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the boot node |

### addExecutionNode

```solidity
function addExecutionNode(string enode) external returns (bytes32)
```

Adds a new execution node to the active state

#### Parameters

| Name  | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| enode | string | The enode URL of the execution node |

#### Return Values

| Name | Type    | Description                                              |
| ---- | ------- | -------------------------------------------------------- |
| [0]  | bytes32 | nodeId The unique identifier of the added execution node |

### quarantineExecutionNode

```solidity
function quarantineExecutionNode(bytes32 nodeId) external
```

Moves an execution node from active to quarantine state

#### Parameters

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the execution node |

### unquarantineExecutionNode

```solidity
function unquarantineExecutionNode(bytes32 nodeId) external
```

Moves an execution node from quarantine back to active state

#### Parameters

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the execution node |

### removeExecutionNode

```solidity
function removeExecutionNode(bytes32 nodeId) external
```

Removes an execution node, setting its state back to none

#### Parameters

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the execution node |

### getNode

```solidity
function getNode(bytes32 nodeId) external view returns (struct IBesuNodeManager.Node)
```

Returns the Node struct for a given ID across all categories

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type                         | Description                                              |
| ---- | ---------------------------- | -------------------------------------------------------- |
| [0]  | struct IBesuNodeManager.Node | node The Node struct containing enode, id, and timestamp |

### isValidator

```solidity
function isValidator(bytes32 nodeId) external view returns (bool)
```

Checks if a node is a validator

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description                                      |
| ---- | ---- | ------------------------------------------------ |
| [0]  | bool | True if the node is a validator, false otherwise |

### isBootNode

```solidity
function isBootNode(bytes32 nodeId) external view returns (bool)
```

Checks if a node is a boot node

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description                                      |
| ---- | ---- | ------------------------------------------------ |
| [0]  | bool | True if the node is a boot node, false otherwise |

### isExecutionNode

```solidity
function isExecutionNode(bytes32 nodeId) external view returns (bool)
```

Checks if a node is an execution node

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| nodeId | bytes32 | The unique identifier of the node |

#### Return Values

| Name | Type | Description                                            |
| ---- | ---- | ------------------------------------------------------ |
| [0]  | bool | True if the node is an execution node, false otherwise |

### getValidatorState

```solidity
function getValidatorState(bytes32 nodeId) external view returns (enum IBesuNodeManager.ValidatorState)
```

Gets the state of a validator node

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the validator |

#### Return Values

| Name | Type                                 | Description                        |
| ---- | ------------------------------------ | ---------------------------------- |
| [0]  | enum IBesuNodeManager.ValidatorState | The current state of the validator |

### getBootNodeState

```solidity
function getBootNodeState(bytes32 nodeId) external view returns (enum IBesuNodeManager.BootNodeState)
```

Gets the state of a boot node

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| nodeId | bytes32 | The unique identifier of the boot node |

#### Return Values

| Name | Type                                | Description                        |
| ---- | ----------------------------------- | ---------------------------------- |
| [0]  | enum IBesuNodeManager.BootNodeState | The current state of the boot node |

### getExecutionNodeState

```solidity
function getExecutionNodeState(bytes32 nodeId) external view returns (enum IBesuNodeManager.ExecutionNodeState)
```

Gets the state of an execution node

#### Parameters

| Name   | Type    | Description                                 |
| ------ | ------- | ------------------------------------------- |
| nodeId | bytes32 | The unique identifier of the execution node |

#### Return Values

| Name | Type                                     | Description                             |
| ---- | ---------------------------------------- | --------------------------------------- |
| [0]  | enum IBesuNodeManager.ExecutionNodeState | The current state of the execution node |
