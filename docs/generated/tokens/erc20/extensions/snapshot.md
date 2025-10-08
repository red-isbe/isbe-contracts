## ERC20Snapshot

Implements snapshot mechanism

_Inherits from IERC20Snapshot and ERC203643InternalCommon_

### snapshot

```solidity
function snapshot() external
```

### balanceOfAt

```solidity
function balanceOfAt(address _account, uint256 _snapshotId) external view returns (uint256)
```

Retrieves the balance of an account at the specified snapshot ID.

_Fetches the balance recorded in the snapshot for a given account.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name         | Type    | Description                                                |
| ------------ | ------- | ---------------------------------------------------------- |
| \_account    | address | The address of the account whose balance is being queried. |
| \_snapshotId | uint256 | The ID of the snapshot to query.                           |

#### Return Values

| Name | Type    | Description                                                      |
| ---- | ------- | ---------------------------------------------------------------- |
| [0]  | uint256 | The balance of the specified account at the queried snapshot ID. |

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 _snapshotId) external view returns (uint256)
```

Retrieves the total token supply at the specified snapshot ID.

_Fetches the total supply recorded in the snapshot at the given ID.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name         | Type    | Description                      |
| ------------ | ------- | -------------------------------- |
| \_snapshotId | uint256 | The ID of the snapshot to query. |

#### Return Values

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| [0]  | uint256 | The total token supply at the queried snapshot ID. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC20SnapshotFacet

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

## ERC20SnapshotInternal

Internal implementation of an ERC20 token with snapshot functionality.
This contract provides the core functionality for recording and querying historical
balances and total supply at specific snapshot IDs.

_This abstract contract: - Implements methods for creating snapshots and retrieving values at specific snapshot IDs. - Extends the `_beforeTokenTransfer` hook to update snapshots for balance changes. - Uses an internal `ERC20SnapshotStorage` struct to manage snapshot data efficiently. - Should be inherited and extended by contracts requiring snapshot functionality.
Includes safeguards for invalid or non-existent snapshot IDs using custom errors._

### ERC20SnapshotStorage

Internal storage structure for managing snapshot metadata.

_Contains: - `accountBalanceSnapshots`: Snapshots of individual account balances. - `totalSupplySnapshots`: Snapshots of total token supply. - `currentSnapshotId`: A counter to maintain monotonically increasing snapshot IDs._

```solidity
struct ERC20SnapshotStorage {
  mapping(address => struct ERC20SnapshotInternal.Snapshots) accountBalanceSnapshots;
  struct ERC20SnapshotInternal.Snapshots totalSupplySnapshots;
  struct Counters.Counter currentSnapshotId;
}
```

### Snapshots

Internal struct to store snapshot data.

_Contains: - `ids`: An array of snapshot IDs. - `values`: An array of values corresponding to those snapshot IDs.
These arrays are used to efficiently store and query snapshot values._

```solidity
struct Snapshots {
    uint256[] ids;
    uint256[] values;
}
```

### \_snapshot

```solidity
function _snapshot() internal virtual returns (uint256)
```

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address _from, address _to, uint256) internal virtual
```

### \_getCurrentSnapshotId

```solidity
function _getCurrentSnapshotId() internal view virtual returns (uint256)
```

### \_valueAt

```solidity
function _valueAt(uint256 _snapshotId, struct ERC20SnapshotInternal.Snapshots _snapshots) internal view returns (bool, uint256)
```

### \_erc20SnapshotStorage

```solidity
function _erc20SnapshotStorage() internal pure returns (struct ERC20SnapshotInternal.ERC20SnapshotStorage storage_)
```

---

## IERC20Snapshot

Interface for ERC20 contracts with snapshot functionality.
This enables recording and querying historical balances and total supply at specific snapshot IDs.

_Provides mechanisms to: - Record snapshots of balances and total supply. - Retrieve an account's balance or the total token supply at a specific snapshot ID. - Use an internal `Snapshots` struct to manage ID and value pairs for snapshots. - Emit events for created snapshots.
This interface should be implemented by ERC20 contracts that require snapshot tracking._

### Snapshot

```solidity
event Snapshot(uint256 id)
```

Emitted when a new snapshot is created.

_The event is triggered in the `_snapshot` function and corresponds to the given `id`._

#### Parameters

| Name | Type    | Description                     |
| ---- | ------- | ------------------------------- |
| id   | uint256 | The ID of the created snapshot. |

### SnapshotWithIdZero

```solidity
error SnapshotWithIdZero()
```

Error indicating that the snapshot ID is invalid because it is zero.

_Snapshot IDs must always start from 1 or higher, and ID 0 is reserved as invalid._

### NonExistentSnapshotId

```solidity
error NonExistentSnapshotId()
```

Error indicating that the given snapshot ID does not exist.

_This is triggered when querying a nonexistent or invalid snapshot ID._

### snapshot

```solidity
function snapshot() external
```

### balanceOfAt

```solidity
function balanceOfAt(address _account, uint256 _snapshotId) external view returns (uint256)
```

Retrieves the balance of an account at the specified snapshot ID.

_Fetches the balance recorded in the snapshot for a given account.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name         | Type    | Description                                                |
| ------------ | ------- | ---------------------------------------------------------- |
| \_account    | address | The address of the account whose balance is being queried. |
| \_snapshotId | uint256 | The ID of the snapshot to query.                           |

#### Return Values

| Name | Type    | Description                                                      |
| ---- | ------- | ---------------------------------------------------------------- |
| [0]  | uint256 | The balance of the specified account at the queried snapshot ID. |

### totalSupplyAt

```solidity
function totalSupplyAt(uint256 _snapshotId) external view returns (uint256)
```

Retrieves the total token supply at the specified snapshot ID.

_Fetches the total supply recorded in the snapshot at the given ID.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name         | Type    | Description                      |
| ------------ | ------- | -------------------------------- |
| \_snapshotId | uint256 | The ID of the snapshot to query. |

#### Return Values

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| [0]  | uint256 | The total token supply at the queried snapshot ID. |
