## BesuNodeManagerFacet

Diamond facet for comprehensive Besu node management

_Concrete facet inheriting from:
     - BesuNodeManagerCommon (combines all manager facades + implementations)
     - DidDocumentDetailedInternal (provides DID document functionality)
     - IEIP2535Introspection (provides Diamond introspection)
     All facade functions with RBAC already defined in manager facades_

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32)
```

Returns the business ID for this facet

_Used by the Diamond pattern for facet identification and routing_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The resolver key for BesuNodeManager (keccak256('BESU_NODE_MANAGER')) |

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the implemented interfaces

_Used for EIP-165 interface detection_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of supported interface IDs |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns all function selectors implemented by this facet

_Required by IEIP2535Introspection_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | Array of function selectors |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Internal function to return implemented interfaces

_Returns the IBesuNodeManager interface ID
     IBesuNodeManager includes all specialized interfaces via inheritance_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of supported interface IDs |



---

## IBesuNodeManager

Unified interface for managing Hyperledger Besu network nodes

_Inherits from all specialized interfaces:
     - IValidatorManager (validator lifecycle and queries)
     - IBootNodeManager (boot node lifecycle and queries)
     - IExecutionNodeManager (execution node lifecycle and queries)
     - IBesuNodeManagerCommon (cross-category utility: getNode)
     All types (enums, structs, errors) are defined in Types library
     All functions, events, and pagination inherited from specialized interfaces_

