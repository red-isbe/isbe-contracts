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
function _addressIsNotZero(address addr) internal pure
```

Checks that a given address is not the zero address.

_Reverts with `AddressZero` error if the condition is not met.
This is an internal helper function intended to be used like a modifier._

#### Parameters

| Name | Type    | Description           |
| ---- | ------- | --------------------- |
| addr | address | The address to check. |

### \_bytes32IsNotZero

```solidity
function _bytes32IsNotZero(bytes32 hash) internal pure
```

Checks that a `bytes32` value is not empty (all zeros).

_Reverts with `EmptyBytes32` error if the condition is not met._

#### Parameters

| Name | Type    | Description                   |
| ---- | ------- | ----------------------------- |
| hash | bytes32 | The `bytes32` value to check. |

### \_emptyBytes

```solidity
function _emptyBytes(bytes code) internal pure
```

Checks that a `bytes` array is not empty.

_Reverts with `EmptyBytes` error if the byte array's length is zero._

#### Parameters

| Name | Type  | Description                 |
| ---- | ----- | --------------------------- |
| code | bytes | The `bytes` array to check. |
