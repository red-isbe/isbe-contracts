## HashTimestamp

Implements timestamp for hashes

_Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions_

### timestampHash

```solidity
function timestampHash(bytes32 hash) external
```

Timestamps a given hash

#### Parameters

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| hash | bytes32 | The hash to be timestamped |

### exists

```solidity
function exists(bytes32 hash) external view returns (bool)
```

Checks whether a hash has been timestamped

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| hash | bytes32 | The hash to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0]  | bool |             |

### getTimestamp

```solidity
function getTimestamp(bytes32 hash) external view returns (uint256)
```

Returns the timestamp when a hash was recorded

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| hash | bytes32 | The hash to query |

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | uint256 |             |

---

## HashTimestampFacet

Implements timestamp for hashes facet

_Inherits from HashTimestamp, providing external timestamp hashes functions_

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Retrieves the function selectors supported by the EIP-2535 Diamond Standard.

_Returns a static list of function selectors supported by the interface. It is a pure function and does not
modify or depend on contract state._

#### Return Values

| Name        | Type     | Description                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------------- |
| selectors\_ | bytes4[] | An array of function selectors (`bytes4[]`) compliant with the EIP-2535 standard. |

---

## HashTimestampInternal

Internal logic for hash timestamp

_Meant to be used only by contracts extending HashTimestamp_

### HashTimestampStorage

Struct storing timestamped hashes

```solidity
struct HashTimestampStorage {
    mapping(bytes32 => uint256) hashTimestamps;
}
```

### onlyNonExistentHash

```solidity
modifier onlyNonExistentHash(bytes32 hash)
```

Modifier to validate that provided hash

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| hash | bytes32 | The hash to check |

### \_timestampHash

```solidity
function _timestampHash(bytes32 hash) internal virtual
```

### \_exists

```solidity
function _exists(bytes32 hash) internal view virtual returns (bool)
```

### \_getTimestamp

```solidity
function _getTimestamp(bytes32 hash) internal view virtual returns (uint256)
```

### \_checkHash

```solidity
function _checkHash(bytes32 hash) internal view virtual
```

### \_hashTimestampStorage

```solidity
function _hashTimestampStorage() internal pure returns (struct HashTimestampInternal.HashTimestampStorage storage_)
```

Returns the storage slot for hash timestamp

_Uses inline assembly to return storage struct at predefined slot_

#### Return Values

| Name      | Type                                              | Description                       |
| --------- | ------------------------------------------------- | --------------------------------- |
| storage\_ | struct HashTimestampInternal.HashTimestampStorage | The hash timestamp storage struct |

---

## IHashTimestamp

Interface for a contract that timestamps hashes

### HashTimestamped

```solidity
event HashTimestamped(bytes32 hash, address sender, uint256 timestamp)
```

Emitted when a hash is timestamped

#### Parameters

| Name      | Type    | Description                                      |
| --------- | ------- | ------------------------------------------------ |
| hash      | bytes32 | The hash that was timestamped                    |
| sender    | address | The address that submitted the hash to timestamp |
| timestamp | uint256 | The block timestamp when the hash was recorded   |

### HashAlreadyExists

```solidity
error HashAlreadyExists(bytes32 hash)
```

### timestampHash

```solidity
function timestampHash(bytes32 hash) external
```

Timestamps a given hash

#### Parameters

| Name | Type    | Description                |
| ---- | ------- | -------------------------- |
| hash | bytes32 | The hash to be timestamped |

### exists

```solidity
function exists(bytes32 hash) external view returns (bool exists_)
```

Checks whether a hash has been timestamped

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| hash | bytes32 | The hash to check |

#### Return Values

| Name     | Type | Description                                             |
| -------- | ---- | ------------------------------------------------------- |
| exists\_ | bool | True if the hash has been recorded, false in other case |

### getTimestamp

```solidity
function getTimestamp(bytes32 hash) external view returns (uint256 timestamp)
```

Returns the timestamp when a hash was recorded

#### Parameters

| Name | Type    | Description       |
| ---- | ------- | ----------------- |
| hash | bytes32 | The hash to query |

#### Return Values

| Name      | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| timestamp | uint256 | The timestamp when the hash was recorded |
