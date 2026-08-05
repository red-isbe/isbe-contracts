## INonceManager

Defines the interface for managing per-account, per-key nonce
        sequences used in account abstraction flows.

_Provides accessors and mutators for composite nonces combining a
     192-bit key and a 64-bit sequence value. Implementations must
     guarantee monotonic increments and ensure replay protection across
     logically separated nonce namespaces. Intended for integration with
     ERC-4337 style validation pipelines where nonce metadata is encoded
     directly into the value._

### incrementNonce

```solidity
function incrementNonce(uint192 key) external
```

Increments the nonce for the message sender and specified key.

_Updates the internal mapping for the sender. The function assumes that
     the caller is the owner of the nonce sequence, ensuring consistent
     sequencing for operations using the same key._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| key | uint192 | The 192-bit key identifying the nonce sequence to increment. |

### getNonce

```solidity
function getNonce(address sender, uint192 key) external view returns (uint256 nonce)
```

Retrieves the current full nonce for a given sender and key.

_Combines the key (upper 192 bits) and the current sequence number (lower 64 bits)
     into a single uint256. Used for constructing nonces compatible with operation
     validation schemes that encode metadata into nonce values._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address whose nonce is being retrieved. |
| key | uint192 | The 192-bit key identifying a logical nonce sequence. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nonce | uint256 | The composite nonce value, combining key and sequence number. |



---

## NonceManagerInternal

Provides internal nonce management utilities for DID-based identity systems.

_Tracks and validates sequential nonces per address and key. Designed for
     integration with EntryPoint-style operation validation or other meta-tx systems.
     Each sender–key pair maintains an independent sequence counter to ensure
     replay protection across different operation contexts._

### NonceManagerStorage

```solidity
struct NonceManagerStorage {
  mapping(address => mapping(uint192 => uint256)) nonceSequenceNumber;
}
```

### _incrementNonce

```solidity
function _incrementNonce(uint192 key) internal
```

Increments the nonce for the message sender and specified key.

_Updates the internal mapping for the sender. The function assumes that
     the caller is the owner of the nonce sequence, ensuring consistent
     sequencing for operations using the same key._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| key | uint192 | The 192-bit key identifying the nonce sequence to increment. |

### _validateAndUpdateNonce

```solidity
function _validateAndUpdateNonce(address sender, uint256 nonce) internal returns (bool)
```

Validates and increments a sender’s nonce in a single operation.

_Used during user operation validation to check that the nonce provided
     matches the expected sequence value. If valid, increments the sequence
     number to prevent replay. Returns `true` on success, `false` otherwise._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address whose nonce is being verified. |
| nonce | uint256 | The full nonce value provided for validation. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool True if the nonce matches and is successfully updated, false otherwise. |

### _getNonce

```solidity
function _getNonce(address sender, uint192 key) internal view returns (uint256 nonce)
```

Retrieves the current full nonce for a given sender and key.

_Combines the key (upper 192 bits) and the current sequence number (lower 64 bits)
     into a single uint256. Used for constructing nonces compatible with operation
     validation schemes that encode metadata into nonce values._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address whose nonce is being retrieved. |
| key | uint192 | The 192-bit key identifying a logical nonce sequence. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| nonce | uint256 | The composite nonce value, combining key and sequence number. |

