## Common

A foundational abstract contract that bundles common functionalities and utility modifiers.

_This contract serves as a base layer for other contracts, inheriting from `Initializable`,
`ERC165Internal`, `AccessControlInternal`, `PauseInternalCommon`, and `OwnableInternal`.
It aggregates essential features like access control, pausable behaviour, and ownership,
and provides convenient modifiers for common validation checks to reduce boilerplate code._

### addressIsNotZero

```solidity
modifier addressIsNotZero(address addr)
```

_Checks if an address equals to zero address_

#### Parameters

| Name | Type    | Description          |
| ---- | ------- | -------------------- |
| addr | address | The address to check |

### bytes32IsNotZero

```solidity
modifier bytes32IsNotZero(bytes32 hash)
```

### emptyCode

```solidity
modifier emptyCode(bytes code)
```

---

## ERC165

Implements the ERC-165 standard for interface detection.

_This abstract contract provides a standardised way to check if a smart contract
implements a given interface. It combines the `IERC165` interface with the internal
logic from `ERC165Internal` to deliver a complete implementation. The `supportsInterface`
function is the primary entry point, allowing external contracts and applications to
query the supported interfaces of a contract._

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) external pure returns (bool)
```

---

## ERC165Internal

Provides the core internal functions for the ERC-165 interface detection standard.

_This abstract contract supplies the foundational logic for ERC-165. It offers internal
helper functions to validate interface IDs, check for support of a specific interface
within an array, and aggregate multiple interface lists. Contracts inheriting from this must
implement the `_implementedInterfaces` function to declare which interfaces they support,
enabling standardised interface detection._

### \_checkERC165ForbiddenInterfaces

```solidity
function _checkERC165ForbiddenInterfaces(bytes4 _interfaceId) internal pure virtual returns (bool)
```

### \_supportsERC165Interface

```solidity
function _supportsERC165Interface(bytes4 _interfaceId) internal pure virtual returns (bool)
```

### \_supportsInterface

```solidity
function _supportsInterface(bytes4 _interfaceId, bytes4[] _interfaces) internal pure virtual returns (bool supported)
```

### \_aggregateInterfaces

```solidity
function _aggregateInterfaces(bytes4[][] interfacesArrays, bytes4[] _interfaces) internal pure returns (bytes4[] interfaces_)
```

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## Initializable

Provides a mechanism to ensure an initialisation function is executed only once per facet.

_This abstract contract manages the initialisation state of contracts, particularly for facets
within a diamond proxy pattern. It employs a unique key (`_facetKey`) to track whether a specific
part of the contract has been initialised, thereby preventing re-entrancy and unauthorised
re-initialisation. The core logic is handled by the `initializer` modifier, which safeguards
functions to ensure they run only a single time. It also includes a function to permanently
disable initialisers, a critical security measure for implementation contracts in a proxy setup._

### InitializableStorage

```solidity
struct InitializableStorage {
    mapping(bytes32 => bool) initialized;
}
```

### Initialized

```solidity
event Initialized(bytes32 facet)
```

_Triggered when the facet has been initialized or reinitialized._

### ContractIsAlreadyInitialized

```solidity
error ContractIsAlreadyInitialized(bytes32 facet)
```

### initializer

```solidity
modifier initializer(bytes32 _facetKey)
```

_Modifier to protect an initialization function so that it can only be invoked by functions with the
{initializer} and {reinitializer} modifiers, directly or indirectly._

### \_disableInitializers

```solidity
function _disableInitializers(bytes32 _facetKey) internal virtual
```

\_Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
to any version. It is recommended to use this to lock implementation contracts that are designed to be called
through proxies.

Emits an {Initialized} event the first time it is successfully executed.\_
