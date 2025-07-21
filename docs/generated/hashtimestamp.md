## HashTimestamp

Implements timestamp for hashes

_Inherits from IHashTimestamp and HashTimestampInternal, providing external timestamp hashes functions_

### timestampHash

```solidity
function timestampHash(bytes32 _hash) external
```

Timestamps a given hash

#### Parameters

| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| \_hash | bytes32 | The hash to be timestamped |

### exists

```solidity
function exists(bytes32 _hash) external view returns (bool)
```

Checks whether a hash has been timestamped

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_hash | bytes32 | The hash to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0]  | bool |             |

### getTimestamp

```solidity
function getTimestamp(bytes32 _hash) external view returns (uint256)
```

Returns the timestamp when a hash was recorded

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_hash | bytes32 | The hash to query |

#### Return Values

| Name | Type    | Description |
| ---- | ------- | ----------- |
| [0]  | uint256 |             |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## HashTimestampFacet

Implements timestamp for hashes facet

_Inherits from HashTimestamp, providing external timestamp hashes functions_

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name         | Type     | Description                                  |
| ------------ | -------- | -------------------------------------------- |
| interfaces\_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| businessId\_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name        | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| selectors\_ | bytes4[] | An array of `bytes4` function selectors. |

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
modifier onlyNonExistentHash(bytes32 _hash)
```

Modifier to validate that provided hash

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_hash | bytes32 | The hash to check |

### \_timestampHash

```solidity
function _timestampHash(bytes32 _hash) internal virtual
```

### \_exists

```solidity
function _exists(bytes32 _hash) internal view virtual returns (bool)
```

### \_getTimestamp

```solidity
function _getTimestamp(bytes32 _hash) internal view virtual returns (uint256)
```

### \_checkHash

```solidity
function _checkHash(bytes32 _hash) internal view virtual
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
function timestampHash(bytes32 _hash) external
```

Timestamps a given hash

#### Parameters

| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| \_hash | bytes32 | The hash to be timestamped |

### exists

```solidity
function exists(bytes32 _hash) external view returns (bool exists_)
```

Checks whether a hash has been timestamped

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_hash | bytes32 | The hash to check |

#### Return Values

| Name     | Type | Description                                             |
| -------- | ---- | ------------------------------------------------------- |
| exists\_ | bool | True if the hash has been recorded, false in other case |

### getTimestamp

```solidity
function getTimestamp(bytes32 _hash) external view returns (uint256 timestamp_)
```

Returns the timestamp when a hash was recorded

#### Parameters

| Name   | Type    | Description       |
| ------ | ------- | ----------------- |
| \_hash | bytes32 | The hash to query |

#### Return Values

| Name        | Type    | Description                              |
| ----------- | ------- | ---------------------------------------- |
| timestamp\_ | uint256 | The timestamp when the hash was recorded |
