## BesuNodeManagerCommon

Common contract implementing cross-category utility functions

_Inherits from all three specialized internal managers to access their storage
     Provides the getNode() function that searches across all node categories_

### getNode

```solidity
function getNode(bytes32 nodeId) external view returns (struct NodeDTO)
```

Returns the NodeDTO for a given ID across all categories

_Searches across validators, boot nodes, and execution nodes
     Returns the complete node information including nodeId, enode, and timestamp_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node (keccak256 of enode) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeDTO | node The NodeDTO containing nodeId, enode, and timestamp |



---

## BesuNodeManagerCommonInternal

Internal contract combining all specialized managers with facades

_Inherits from all three facade managers and the common utility layer:
     - ValidatorManager (validator facade with RBAC declarations)
     - BootNodeManager (boot node facade with RBAC declarations)
     - ExecutionNodeManager (execution node facade with RBAC declarations)
     - BesuNodeManagerCommon (cross-category getNode implementation)
     Note: This resolves the diamond inheritance by inheriting facades that
           don't include their own Internal inheritance, while BesuNodeManagerCommon
           provides the actual Internal implementations_

### _getNode

```solidity
function _getNode(bytes32 nodeId) internal view returns (struct NodeDTO node_)
```

Internal function to get a complete NodeDTO for a given nodeId

_Searches across all categories (validators, boot nodes, execution nodes)
     Returns NodeDTO with nodeId included for caller convenience_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The node ID to query |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| node_ | struct NodeDTO | The NodeDTO containing nodeId, enode, and timestamp |



---

## IBesuNodeManagerCommon

Interface for cross-category BesuNodeManager utility functions

_Provides functions that operate across all node categories (validators, boot nodes, execution nodes)_

### getNode

```solidity
function getNode(bytes32 nodeId) external view returns (struct NodeDTO)
```

Returns the NodeDTO for a given ID across all categories

_Searches across validators, boot nodes, and execution nodes
     Returns the complete node information including nodeId, enode, and timestamp_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| nodeId | bytes32 | The unique identifier of the node (keccak256 of enode) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NodeDTO | node The NodeDTO containing nodeId, enode, and timestamp |

