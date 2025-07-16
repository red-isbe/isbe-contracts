## ISBEContext

Provides context-related utility functions and common validation checks.

_This abstract contract encapsulates common helper functions for accessing blockchain
context information (e.g., block timestamp, message signature) and for performing
standard input validation. Making these functions `virtual` allows for easier mocking
and testing in derivative contracts. The contract is an extension of the OpenZeppelin `Context` contract._

### AddressZero

```solidity
error AddressZero(address addr)
```

Raised when an operation receives the zero address where a valid address is expected.

#### Parameters

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| addr | address | The address that was found to be zero. |

### EmptyBytes32

```solidity
error EmptyBytes32()
```

Raised when a `bytes32` value is empty (i.e., all zeros) but is expected to have a value.

### EmptyBytes

```solidity
error EmptyBytes()
```

Raised when a `bytes` array is empty but is expected to have content.

### UnimplementedMethod

```solidity
error UnimplementedMethod()
```

Raised when a function is called that has not been implemented.

_This is useful in fallback functions or as a placeholder to prevent
the execution of incomplete or abstract functionality._

### \_blockTimestamp

```solidity
function _blockTimestamp() internal view virtual returns (uint256)
```

Returns the timestamp of the current block.

_This is a virtual function that wraps `block.timestamp`, allowing it to be
overridden in child contracts for testing purposes._

#### Return Values

| Name | Type    | Description                          |
| ---- | ------- | ------------------------------------ |
| [0]  | uint256 | uint256 The current block timestamp. |

### \_msgSig

```solidity
function _msgSig() internal view virtual returns (bytes4)
```

Returns the function selector of the current call (`msg.sig`).

_This is a virtual function that wraps `msg.sig`, allowing it to be
overridden in child contracts for testing purposes._

#### Return Values

| Name | Type   | Description                                      |
| ---- | ------ | ------------------------------------------------ |
| [0]  | bytes4 | bytes4 The function selector from the call data. |

### \_addressIsNotZero

```solidity
function _addressIsNotZero(address _addr) internal pure
```

Checks that a given address is not the zero address.

_Reverts with `AddressZero` error if the condition is not met.
This is an internal helper function intended to be used like a modifier._

#### Parameters

| Name   | Type    | Description           |
| ------ | ------- | --------------------- |
| \_addr | address | The address to check. |

### \_bytes32IsNotZero

```solidity
function _bytes32IsNotZero(bytes32 _hash) internal pure
```

Checks that a `bytes32` value is not empty (all zeros).

_Reverts with `EmptyBytes32` error if the condition is not met._

#### Parameters

| Name   | Type    | Description                   |
| ------ | ------- | ----------------------------- |
| \_hash | bytes32 | The `bytes32` value to check. |

### \_emptyBytes

```solidity
function _emptyBytes(bytes _code) internal pure
```

Checks that a `bytes` array is not empty.

_Reverts with `EmptyBytes` error if the byte array's length is zero._

#### Parameters

| Name   | Type  | Description                 |
| ------ | ----- | --------------------------- |
| \_code | bytes | The `bytes` array to check. |

---

## InitializeBusinessLogic

This is an abstract contract that provides a safe way to run setup instructions
from a separate "business logic" contract.

_This contract is designed to be inherited by another contract, typically a proxy,
that needs to delegate its initialisation to an implementation contract.
It provides a standardised internal function, `_initialize`, which performs a
`delegatecall`. This allows the inheriting contract to execute code from another
address as if it were its own, ensuring state is initialised in the proxy's context._

### InitializationFunctionReverted

```solidity
error InitializationFunctionReverted(address _initializationContractAddress, bytes _calldata, bytes _error)
```

Emitted when the initialisation function call failed without returning a specific error message.

_This error is reverted when the `delegatecall` within `_initialize` returns `success = false`
but provides no specific error data (i.e., the return data size is zero)._

#### Parameters

| Name                            | Type    | Description                                                              |
| ------------------------------- | ------- | ------------------------------------------------------------------------ |
| \_initializationContractAddress | address | The address of the contract that was meant to handle the initialisation. |
| \_calldata                      | bytes   | The raw call data that was sent in the failed delegate call.             |
| \_error                         | bytes   | The empty byte string returned from the failed call.                     |

### NoBytecodeAtAddress

```solidity
error NoBytecodeAtAddress(address _contractAddress, string _message)
```

#### Parameters

| Name              | Type    | Description                                        |
| ----------------- | ------- | -------------------------------------------------- |
| \_contractAddress | address | The address that was expected to contain bytecode. |
| \_message         | string  | A descriptive error message.                       |

### \_initializeBusinessLogic

```solidity
function _initializeBusinessLogic(address _init, bytes _calldata) internal
```

Internally executes the initialisation logic using a delegate call.

_This function makes a low-level `delegatecall` to a specified address (`_init`)
with provided call data (`_calldata`). It is a core mechanism for proxy patterns,
allowing an implementation contract to set the initial state of the proxy's storage.
If the delegate call fails, this function will "bubble up" (re-throw) the original
revert message from the target contract. If the call fails without providing such a
message, it reverts with the custom `InitializationFunctionReverted` error instead._

#### Parameters

| Name       | Type    | Description                                                                     |
| ---------- | ------- | ------------------------------------------------------------------------------- |
| \_init     | address | The address of the implementation contract containing the logic to be executed. |
| \_calldata | bytes   | The encoded function call and arguments to be executed by the `_init` contract. |

### \_enforceHasContractCode

```solidity
function _enforceHasContractCode(address _contract, string _errorMessage) internal view
```
