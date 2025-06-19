## Common

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

## Initializable

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
