## INameResolver

Interface for managing reverse DNS resolution within the Ethereum Name Service

_Provides functionality to associate human-readable names with ENS nodes for
reverse lookup operations as specified in EIP-181_

### NameChanged

```solidity
event NameChanged(bytes32 node, string name)
```

Emitted when a name is associated with an ENS node

#### Parameters

| Name | Type    | Description                                          |
| ---- | ------- | ---------------------------------------------------- |
| node | bytes32 | The ENS node hash receiving the new name association |
| name | string  | The human-readable name being assigned to the node   |

### setName

```solidity
function setName(bytes32 node, string newName) external
```

Associates a human-readable name with an ENS node for reverse resolution

_Enables reverse DNS lookups by storing the canonical name for a given node_

#### Parameters

| Name    | Type    | Description                                                  |
| ------- | ------- | ------------------------------------------------------------ |
| node    | bytes32 | The ENS node hash to receive the name association            |
| newName | string  | The human-readable name to associate with the specified node |

### name

```solidity
function name(bytes32 node) external view returns (string associatedName)
```

Retrieves the human-readable name associated with an ENS node

_Returns the canonical name for reverse DNS resolution as defined in EIP-181_

#### Parameters

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| node | bytes32 | The ENS node hash to query for its associated name |

#### Return Values

| Name           | Type   | Description                                          |
| -------------- | ------ | ---------------------------------------------------- |
| associatedName | string | The human-readable name linked to the specified node |

---

## NameResolver

External implementation of ENS name resolver providing reverse DNS functionality

_Abstract contract that exposes the INameResolver interface whilst delegating core logic
to internal functions. Applies pause protection on write operations, authorisation checks,
and role-based access control. Extends NameResolverInternal for storage management_

### setName

```solidity
function setName(bytes32 node, string newName) external
```

Associates a human-readable name with an ENS node for reverse resolution

_Enables reverse DNS lookups by storing the canonical name for a given node_

#### Parameters

| Name    | Type    | Description                                                  |
| ------- | ------- | ------------------------------------------------------------ |
| node    | bytes32 | The ENS node hash to receive the name association            |
| newName | string  | The human-readable name to associate with the specified node |

### name

```solidity
function name(bytes32 node) external view returns (string associatedName)
```

Retrieves the human-readable name associated with an ENS node

_Returns the canonical name for reverse DNS resolution as defined in EIP-181_

#### Parameters

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| node | bytes32 | The ENS node hash to query for its associated name |

#### Return Values

| Name           | Type   | Description                                          |
| -------------- | ------ | ---------------------------------------------------- |
| associatedName | string | The human-readable name linked to the specified node |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Provides interface introspection support for ENS name resolver compatibility

_Internal pure function enabling ERC-165 interface detection for ENS name resolver.
Returns only INameResolver interface support_

#### Return Values

| Name         | Type     | Description                                                           |
| ------------ | -------- | --------------------------------------------------------------------- |
| interfaces\_ | bytes4[] | Array containing the interface identifiers supported by this resolver |

---

## NameResolverFacet

EIP-2535 facet that exposes the ENS name resolver functionality

_Inherits from NameResolver and provides introspection of interfaces, business logic, and selectors_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this facet

_Provides ERC-165 interface introspection for ENS name resolver compatibility_

#### Return Values

| Name         | Type     | Description                                                        |
| ------------ | -------- | ------------------------------------------------------------------ |
| interfaces\_ | bytes4[] | Array containing the interface identifiers supported by this facet |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this facet

_Provides the unique resolver key that identifies this business logic component_

#### Return Values

| Name         | Type    | Description                                                                     |
| ------------ | ------- | ------------------------------------------------------------------------------- |
| businessId\_ | bytes32 | The resolver key that uniquely identifies this ENS name resolver implementation |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors exposed by this facet

_Lists all external functions available through this facet for diamond proxy integration_

#### Return Values

| Name        | Type     | Description                                                 |
| ----------- | -------- | ----------------------------------------------------------- |
| selectors\_ | bytes4[] | Array of function selectors that this facet makes available |

---

## NameResolverInternal

Internal implementation contract providing ENS name resolution functionality

_Abstract contract implementing the core logic for ENS name resolution (reverse DNS).
Extends EnsResolverInternal to inherit authorization and delegation capabilities.
Uses unstructured storage to enable upgradeable proxy patterns_

### NameResolverStorage

Storage structure containing ENS name resolver state data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct NameResolverStorage {
    mapping(bytes32 => string) names;
}
```

### \_setName

```solidity
function _setName(bytes32 _node, string _newName) internal
```

Associates a human-readable name with an ENS node

_Internal function storing canonical name for reverse DNS resolution_

#### Parameters

| Name      | Type    | Description                                        |
| --------- | ------- | -------------------------------------------------- |
| \_node    | bytes32 | The ENS node hash to receive the name association  |
| \_newName | string  | The human-readable name to associate with the node |

### \_name

```solidity
function _name(bytes32 _node) internal view returns (string)
```

Retrieves the human-readable name associated with an ENS node

_Internal view function providing access to stored name data for reverse resolution_

#### Parameters

| Name   | Type    | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| \_node | bytes32 | The ENS node hash to query for its associated name |

#### Return Values

| Name | Type   | Description                                          |
| ---- | ------ | ---------------------------------------------------- |
| [0]  | string | The human-readable name linked to the specified node |
