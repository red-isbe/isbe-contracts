## IPubkeyResolver

Interface for managing SECP256k1 public key records within ENS nodes

_Provides functionality to store and retrieve elliptic curve public keys for
     cryptographic verification and digital signature operations as defined in EIP-619_

### PubkeyChanged

```solidity
event PubkeyChanged(bytes32 node, bytes32 x, bytes32 y)
```

Emitted when a public key is associated with an ENS node

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | bytes32 | The ENS node hash receiving the new public key assignment |
| x | bytes32 | The X coordinate of the elliptic curve point for the public key |
| y | bytes32 | The Y coordinate of the elliptic curve point for the public key |

### setPubkey

```solidity
function setPubkey(bytes32 node, bytes32 x, bytes32 y) external
```

Associates a SECP256k1 public key with an ENS node

_Stores the elliptic curve coordinates for cryptographic verification purposes_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | bytes32 | The ENS node hash to receive the public key assignment |
| x | bytes32 | The X coordinate of the SECP256k1 elliptic curve point |
| y | bytes32 | The Y coordinate of the SECP256k1 elliptic curve point |

### pubkey

```solidity
function pubkey(bytes32 node) external view returns (bytes32 xCoordinate, bytes32 yCoordinate)
```

Retrieves the SECP256k1 public key associated with an ENS node

_Returns the elliptic curve coordinates as defined in EIP-619 specification_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | bytes32 | The ENS node hash to query for its associated public key |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| xCoordinate | bytes32 | The X coordinate of the elliptic curve point for the public key |
| yCoordinate | bytes32 | The Y coordinate of the elliptic curve point for the public key |



---

## PubkeyResolver

External implementation of ENS pubkey resolver providing SECP256k1 public key management

_Abstract contract that exposes the IPubkeyResolver interface whilst delegating core logic
     to internal functions. Applies pause protection on write operations, authorisation checks,
     and role-based access control. Extends PubkeyResolverInternal for storage management_

### setPubkey

```solidity
function setPubkey(bytes32 node, bytes32 x, bytes32 y) external
```

Associates a SECP256k1 public key with an ENS node

_Stores the elliptic curve coordinates for cryptographic verification purposes_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | bytes32 | The ENS node hash to receive the public key assignment |
| x | bytes32 | The X coordinate of the SECP256k1 elliptic curve point |
| y | bytes32 | The Y coordinate of the SECP256k1 elliptic curve point |

### pubkey

```solidity
function pubkey(bytes32 node) external view returns (bytes32 xCoordinate, bytes32 yCoordinate)
```

Retrieves the SECP256k1 public key associated with an ENS node

_Returns the elliptic curve coordinates as defined in EIP-619 specification_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | bytes32 | The ENS node hash to query for its associated public key |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| xCoordinate | bytes32 | The X coordinate of the elliptic curve point for the public key |
| yCoordinate | bytes32 | The Y coordinate of the elliptic curve point for the public key |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Provides interface introspection support for ENS pubkey resolver compatibility

_Internal pure function enabling ERC-165 interface detection for ENS pubkey resolver.
     Returns only IPubkeyResolver interface support_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array containing the interface identifiers supported by this resolver |



---

## PubkeyResolverFacet

EIP-2535 facet that exposes the ENS pubkey resolver functionality

_Inherits from PubkeyResolver and provides introspection of interfaces, business logic, and selectors.
     Only exposes IPubkeyResolver functions, not IEnsResolver functions which are handled by EnsResolverFacet_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this facet

_Provides ERC-165 interface introspection for ENS pubkey resolver compatibility_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array containing the interface identifiers supported by this facet |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this facet

_Provides the unique resolver key that identifies this business logic component_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The resolver key that uniquely identifies this ENS pubkey resolver implementation |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns the function selectors exposed by this facet

_Lists only IPubkeyResolver functions available through this facet for diamond proxy integration_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | Array of function selectors that this facet makes available |



---

## PubkeyResolverInternal

Internal implementation contract providing ENS public key resolution functionality

_Abstract contract implementing the core logic for ENS SECP256k1 public key management.
     Extends EnsResolverInternal to inherit authorization and delegation capabilities.
     Uses unstructured storage to enable upgradeable proxy patterns_

### PubkeyResolverStorage

Storage structure containing ENS pubkey resolver state data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PubkeyResolverStorage {
  mapping(bytes32 => struct PubkeyResolverInternal.PublicKey) pubkeys;
}
```

### PublicKey

Structure representing SECP256k1 public key coordinates

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct PublicKey {
  bytes32 x;
  bytes32 y;
}
```

### _setPubkey

```solidity
function _setPubkey(bytes32 _node, bytes32 _x, bytes32 _y) internal
```

Associates a SECP256k1 public key with an ENS node

_Internal function storing elliptic curve coordinates for cryptographic verification_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | bytes32 | The ENS node hash to receive the public key assignment |
| _x | bytes32 | The X coordinate of the SECP256k1 elliptic curve point |
| _y | bytes32 | The Y coordinate of the SECP256k1 elliptic curve point |

### _pubkey

```solidity
function _pubkey(bytes32 _node) internal view returns (bytes32 xCoordinate, bytes32 yCoordinate)
```

Retrieves the SECP256k1 public key associated with an ENS node

_Internal view function providing access to stored public key coordinates_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | bytes32 | The ENS node hash to query for its associated public key |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| xCoordinate | bytes32 | The X coordinate of the elliptic curve point for the public key |
| yCoordinate | bytes32 | The Y coordinate of the elliptic curve point for the public key |

