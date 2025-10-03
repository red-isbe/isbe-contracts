## ITextResolver

Interface for managing arbitrary text metadata records within ENS nodes

_Provides functionality to store and retrieve key-value text data pairs for
flexible metadata management and decentralised identity information storage_

### TextChanged

```solidity
event TextChanged(bytes32 node, string indexedKey, string key, string value)
```

Emitted when text data is associated with an ENS node and key

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| node       | bytes32 | The ENS node hash receiving the text data assignment     |
| indexedKey | string  | The text data key indexed for efficient filtering        |
| key        | string  | The text data key identifier for metadata categorisation |
| value      | string  | The text data value being stored for the specified key   |

### setText

```solidity
function setText(bytes32 node, string key, string value) external
```

Associates text data with an ENS node using a specified key

_Stores arbitrary text metadata for flexible information management_

#### Parameters

| Name  | Type    | Description                                              |
| ----- | ------- | -------------------------------------------------------- |
| node  | bytes32 | The ENS node hash to receive the text data assignment    |
| key   | string  | The text data key identifier for metadata categorisation |
| value | string  | The text data value to store for the specified key       |

### text

```solidity
function text(bytes32 node, string key) external view returns (string textValue)
```

Retrieves text data associated with an ENS node and key

_Returns the stored text metadata for the specified node and key combination_

#### Parameters

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| node | bytes32 | The ENS node hash to query for text data               |
| key  | string  | The text data key identifier to retrieve the value for |

#### Return Values

| Name      | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| textValue | string | The text data value associated with the node and key |

---

## TextResolver

External implementation of ENS text resolver providing key-value text record management

_Abstract contract that exposes the ITextResolver interface whilst delegating core logic
to internal functions. Applies pause protection on write operations, authorisation checks,
and role-based access control. Extends TextResolverInternal for storage management_

### setText

```solidity
function setText(bytes32 node, string key, string value) external
```

Associates text data with an ENS node using a specified key

_Stores arbitrary text metadata for flexible information management_

#### Parameters

| Name  | Type    | Description                                              |
| ----- | ------- | -------------------------------------------------------- |
| node  | bytes32 | The ENS node hash to receive the text data assignment    |
| key   | string  | The text data key identifier for metadata categorisation |
| value | string  | The text data value to store for the specified key       |

### text

```solidity
function text(bytes32 node, string key) external view returns (string textValue)
```

Retrieves text data associated with an ENS node and key

_Returns the stored text metadata for the specified node and key combination_

#### Parameters

| Name | Type    | Description                                            |
| ---- | ------- | ------------------------------------------------------ |
| node | bytes32 | The ENS node hash to query for text data               |
| key  | string  | The text data key identifier to retrieve the value for |

#### Return Values

| Name      | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| textValue | string | The text data value associated with the node and key |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Provides interface introspection support for ENS text resolver compatibility

_Internal pure function enabling ERC-165 interface detection for ENS text resolver.
Returns only ITextResolver interface support_

#### Return Values

| Name         | Type     | Description                                                           |
| ------------ | -------- | --------------------------------------------------------------------- |
| interfaces\_ | bytes4[] | Array containing the interface identifiers supported by this resolver |

---

## TextResolverFacet

EIP-2535 facet that exposes the ENS text resolver functionality

_Inherits from TextResolver and provides introspection of interfaces, business logic, and selectors.
Only exposes ITextResolver functions, not IEnsResolver functions which are handled by EnsResolverFacet_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this facet

_Provides ERC-165 interface introspection for ENS text resolver compatibility_

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
| businessId\_ | bytes32 | The resolver key that uniquely identifies this ENS text resolver implementation |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors exposed by this facet

_Lists only ITextResolver functions available through this facet for diamond proxy integration_

#### Return Values

| Name        | Type     | Description                                                 |
| ----------- | -------- | ----------------------------------------------------------- |
| selectors\_ | bytes4[] | Array of function selectors that this facet makes available |

---

## TextResolverInternal

Internal implementation contract providing ENS text resolution functionality

_Abstract contract implementing the core logic for ENS text record management.
Extends EnsResolverInternal to inherit authorization and delegation capabilities.
Uses unstructured storage to enable upgradeable proxy patterns_

### TextResolverStorage

Storage structure containing ENS text resolver state data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct TextResolverStorage {
    mapping(bytes32 => mapping(string => string)) texts;
}
```

### \_setText

```solidity
function _setText(bytes32 _node, string _key, string _value) internal
```

Associates text data with an ENS node using a specified key

_Internal function storing arbitrary text metadata for flexible information management_

#### Parameters

| Name    | Type    | Description                                              |
| ------- | ------- | -------------------------------------------------------- |
| \_node  | bytes32 | The ENS node hash to receive the text data assignment    |
| \_key   | string  | The text data key identifier for metadata categorisation |
| \_value | string  | The text data value to store for the specified key       |

### \_text

```solidity
function _text(bytes32 _node, string _key) internal view returns (string)
```

Retrieves text data associated with an ENS node and key

_Internal view function providing access to stored text metadata_

#### Parameters

| Name   | Type    | Description                                            |
| ------ | ------- | ------------------------------------------------------ |
| \_node | bytes32 | The ENS node hash to query for text data               |
| \_key  | string  | The text data key identifier to retrieve the value for |

#### Return Values

| Name | Type   | Description                                          |
| ---- | ------ | ---------------------------------------------------- |
| [0]  | string | The text data value associated with the node and key |
