## ERC721Snapshot

Implements snapshot mechanism for ERC721 tokens

_Inherits from IERC721Snapshot and ERC721SnapshotInternal_

### snapshot

```solidity
function snapshot() external
```

Creates a new snapshot.

_Only callable by accounts with the snapshot role.
Emits a Snapshot event._

### balanceOfAt

```solidity
function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256)
```

Retrieves the balance of an account at the specified snapshot ID.

#### Parameters

| Name       | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| account    | address | The address of the account whose balance is being queried. |
| snapshotId | uint256 | The ID of the snapshot to query.                           |

#### Return Values

| Name | Type    | Description                                                      |
| ---- | ------- | ---------------------------------------------------------------- |
| [0]  | uint256 | The balance of the specified account at the queried snapshot ID. |

### totalSupply

```solidity
function totalSupply(uint256 snapshotId) external view returns (uint256)
```

Retrieves the total token supply at the specified snapshot ID.

#### Parameters

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| snapshotId | uint256 | The ID of the snapshot to query. |

#### Return Values

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| [0]  | uint256 | The total token supply at the queried snapshot ID. |

### ownerOfAt

```solidity
function ownerOfAt(uint256 tokenId, uint256 snapshotId) external view returns (address)
```

Retrieves the owner of a token at the specified snapshot ID.

#### Parameters

| Name       | Type    | Description                                       |
| ---------- | ------- | ------------------------------------------------- |
| tokenId    | uint256 | The ID of the token whose owner is being queried. |
| snapshotId | uint256 | The ID of the snapshot to query.                  |

#### Return Values

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| [0]  | address | The owner of the specified token at the queried snapshot ID. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ERC721SnapshotFacet

Facet for ERC721 snapshot functionality in diamond/facet architectures.

_Exposes external interface for snapshot management and querying. - Allows taking snapshots, querying balances, total supply, and ownership at specific snapshots. - Should be registered in the diamond with all required selectors._

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

## ERC721SnapshotInternal

Internal implementation of an ERC721 token with snapshot functionality.
Provides the core logic for recording and querying historical balances,
ownership, and total supply at specific snapshot IDs.

_This abstract contract: - Implements methods for creating snapshots and retrieving values at specific snapshot IDs. - Extends the \_beforeTokenTransfer and \_afterTokenTransfer hooks to update snapshots for
balance and ownership changes. - Uses an internal ERC721SnapshotStorage struct to manage snapshot data efficiently. - Should be inherited and extended by contracts requiring snapshot functionality.
Includes safeguards for invalid or non-existent snapshot IDs using custom errors._

### Snapshots

```solidity
struct Snapshots {
    uint256[] ids;
    uint256[] values;
}
```

### TokenOwnerSnapshots

```solidity
struct TokenOwnerSnapshots {
    uint256[] ids;
    address[] owners;
}
```

### ERC721SnapshotStorage

```solidity
struct ERC721SnapshotStorage {
  mapping(address => struct ERC721SnapshotInternal.Snapshots) accountBalanceSnapshots;
  struct ERC721SnapshotInternal.Snapshots totalSupplySnapshots;
  mapping(uint256 => struct ERC721SnapshotInternal.TokenOwnerSnapshots) tokenOwnerSnapshots;
  struct Counters.Counter currentSnapshotId;
}
```

### \_snapshot

```solidity
function _snapshot() internal virtual returns (uint256)
```

### \_beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual returns (bool)
```

### \_balanceOfAt

```solidity
function _balanceOfAt(address account, uint256 snapshotId) internal view returns (uint256)
```

### \_totalSupplyAt

```solidity
function _totalSupplyAt(uint256 snapshotId) internal view returns (uint256)
```

### \_ownerOfAt

```solidity
function _ownerOfAt(uint256 tokenId, uint256 snapshotId) internal view returns (address)
```

### \_getCurrentSnapshotId

```solidity
function _getCurrentSnapshotId() internal view virtual returns (uint256)
```

### \_valueAt

```solidity
function _valueAt(uint256 snapshotId, struct ERC721SnapshotInternal.Snapshots snapshots) internal view returns (bool, uint256)
```

### \_ownerAt

```solidity
function _ownerAt(uint256 snapshotId, struct ERC721SnapshotInternal.TokenOwnerSnapshots snapshots) internal view returns (bool, address)
```

### \_checkSnapshotIdExists

```solidity
function _checkSnapshotIdExists(uint256 snapshotId) internal view
```

---

## IERC721Snapshot

Interface for ERC721 contracts with snapshot functionality.
Enables recording and querying historical ownership, balances, and total supply at specific snapshot IDs.

_Provides mechanisms to: - Record snapshots of ownership, balances, and total supply. - Retrieve an account's balance or the total token supply at a specific snapshot ID. - Retrieve the owner of a token at a specific snapshot ID. - Emit events for created snapshots.
This interface should be implemented by ERC721 contracts that require snapshot tracking._

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

Creates a new snapshot.

_Should be called to record the current state of balances, ownership, and total supply.
Emits a `Snapshot` event._

### balanceOfAt

```solidity
function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256)
```

Retrieves the balance of an account at the specified snapshot ID.

_Fetches the balance recorded in the snapshot for a given account.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name       | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| account    | address | The address of the account whose balance is being queried. |
| snapshotId | uint256 | The ID of the snapshot to query.                           |

#### Return Values

| Name | Type    | Description                                                      |
| ---- | ------- | ---------------------------------------------------------------- |
| [0]  | uint256 | The balance of the specified account at the queried snapshot ID. |

### totalSupply

```solidity
function totalSupply(uint256 snapshotId) external view returns (uint256)
```

Retrieves the total token supply at the specified snapshot ID.

_Fetches the total supply recorded in the snapshot at the given ID.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name       | Type    | Description                      |
| ---------- | ------- | -------------------------------- |
| snapshotId | uint256 | The ID of the snapshot to query. |

#### Return Values

| Name | Type    | Description                                        |
| ---- | ------- | -------------------------------------------------- |
| [0]  | uint256 | The total token supply at the queried snapshot ID. |

### ownerOfAt

```solidity
function ownerOfAt(uint256 tokenId, uint256 snapshotId) external view returns (address)
```

Retrieves the owner of a token at the specified snapshot ID.

_Fetches the owner recorded in the snapshot for a given tokenId.
Will revert if the snapshot ID is invalid or does not exist._

#### Parameters

| Name       | Type    | Description                                       |
| ---------- | ------- | ------------------------------------------------- |
| tokenId    | uint256 | The ID of the token whose owner is being queried. |
| snapshotId | uint256 | The ID of the snapshot to query.                  |

#### Return Values

| Name | Type    | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| [0]  | address | The owner of the specified token at the queried snapshot ID. |
