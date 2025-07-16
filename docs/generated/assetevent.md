## AssetEventTracker

Implements generic state tracking for an asset using events

### recordState

```solidity
function recordState(uint256 _newState) external
```

Register new asset event

#### Parameters

| Name       | Type    | Description                    |
| ---------- | ------- | ------------------------------ |
| \_newState | uint256 | New asset state for this event |

### getAssetEvents

```solidity
function getAssetEvents(uint256 _pageNumber, uint256 _resultsPerPage) external view returns (struct IAssetEventTracker.AssetEvent[] assetEvents_)
```

Return paginated events based on page number and results per page

#### Parameters

| Name             | Type    | Description                   |
| ---------------- | ------- | ----------------------------- |
| \_pageNumber     | uint256 | Page number (starting with 0) |
| \_resultsPerPage | uint256 | Number of results per page    |

#### Return Values

| Name          | Type                                   | Description        |
| ------------- | -------------------------------------- | ------------------ |
| assetEvents\_ | struct IAssetEventTracker.AssetEvent[] | Asset events array |

### getLatestAssetEvent

```solidity
function getLatestAssetEvent() external view returns (struct IAssetEventTracker.AssetEvent)
```

Return latest asset event

#### Return Values

| Name | Type                                 | Description                   |
| ---- | ------------------------------------ | ----------------------------- |
| [0]  | struct IAssetEventTracker.AssetEvent | Latest asset event registered |

### getCurrentState

```solidity
function getCurrentState() external view returns (uint256)
```

Return current state

#### Return Values

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | Latest state registered |

### isStateChangeAllowed

```solidity
function isStateChangeAllowed(uint256 _newState) external view returns (bool)
```

Return if state change is allowed

#### Parameters

| Name       | Type    | Description               |
| ---------- | ------- | ------------------------- |
| \_newState | uint256 | New asset state to change |

#### Return Values

| Name | Type | Description                 |
| ---- | ---- | --------------------------- |
| [0]  | bool | True or false if is allowed |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## AssetEventTrackerFacet

Implements generic state tracking for an asset using events

_Inherits from AssetEventTracker, providing asset event tracker functions_

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

## AssetEventTrackerInternal

Implements generic state tracking for an asset using events

### AssetEventTrackerStorage

Struct storing all asset events

```solidity
struct AssetEventTrackerStorage {
  struct IAssetEventTracker.AssetEvent[] assetEvents;
}
```

### onlyAllowedStateChange

```solidity
modifier onlyAllowedStateChange(uint256 _newState)
```

Modifier to validate state change is allowed

#### Parameters

| Name       | Type    | Description            |
| ---------- | ------- | ---------------------- |
| \_newState | uint256 | The new state to check |

### \_recordState

```solidity
function _recordState(uint256 _newState) internal virtual
```

### \_getAssetEvents

```solidity
function _getAssetEvents(uint256 _pageNumber, uint256 _resultsPerPage) internal view virtual returns (struct IAssetEventTracker.AssetEvent[] assetEvents_)
```

### \_getLatestAssetEvent

```solidity
function _getLatestAssetEvent() internal view virtual returns (struct IAssetEventTracker.AssetEvent assetEvent_)
```

### \_getCurrentState

```solidity
function _getCurrentState() internal view virtual returns (uint256)
```

### \_getAssetEventByIndex

```solidity
function _getAssetEventByIndex(uint256 _index) internal view returns (struct IAssetEventTracker.AssetEvent assetEvent_)
```

Returns an asset event by index

#### Parameters

| Name    | Type    | Description         |
| ------- | ------- | ------------------- |
| \_index | uint256 | The index to obtain |

#### Return Values

| Name         | Type                                 | Description          |
| ------------ | ------------------------------------ | -------------------- |
| assetEvent\_ | struct IAssetEventTracker.AssetEvent | Asset event obtained |

### \_checkStateChange

```solidity
function _checkStateChange(uint256 _newState) internal view virtual
```

Check if state change is allowed

#### Parameters

| Name       | Type    | Description             |
| ---------- | ------- | ----------------------- |
| \_newState | uint256 | The new state to change |

### \_isStateChangeAllowed

```solidity
function _isStateChangeAllowed(uint256 _currentState, uint256 _newState) internal pure virtual returns (bool)
```

### \_assetEventTrackerStorage

```solidity
function _assetEventTrackerStorage() internal pure returns (struct AssetEventTrackerInternal.AssetEventTrackerStorage storage_)
```

Returns the storage slot for asset event tracker

_Uses inline assembly to return storage struct at predefined slot_

#### Return Values

| Name      | Type                                                      | Description                            |
| --------- | --------------------------------------------------------- | -------------------------------------- |
| storage\_ | struct AssetEventTrackerInternal.AssetEventTrackerStorage | The asset event tracker storage struct |

---

## IAssetEventTracker

Interface to track asset events

### AssetEvent

```solidity
struct AssetEvent {
    uint256 state;
    uint256 timestamp;
}
```

### StateRecorded

```solidity
event StateRecorded(uint256 state, uint256 timestamp, address sender)
```

Emitted when a state is recorded

#### Parameters

| Name      | Type    | Description                                         |
| --------- | ------- | --------------------------------------------------- |
| state     | uint256 | The state that was recorded                         |
| timestamp | uint256 | The block timestamp when the state was recorded     |
| sender    | address | The address that submitted the state to be recorded |

### StateChangeNotAllowed

```solidity
error StateChangeNotAllowed(uint256 newState)
```

### recordState

```solidity
function recordState(uint256 _newState) external
```

Register new asset event

#### Parameters

| Name       | Type    | Description                    |
| ---------- | ------- | ------------------------------ |
| \_newState | uint256 | New asset state for this event |

### getAssetEvents

```solidity
function getAssetEvents(uint256 _pageNumber, uint256 _resultsPerPage) external view returns (struct IAssetEventTracker.AssetEvent[] assetEvents_)
```

Return paginated events based on page number and results per page

#### Parameters

| Name             | Type    | Description                   |
| ---------------- | ------- | ----------------------------- |
| \_pageNumber     | uint256 | Page number (starting with 0) |
| \_resultsPerPage | uint256 | Number of results per page    |

#### Return Values

| Name          | Type                                   | Description        |
| ------------- | -------------------------------------- | ------------------ |
| assetEvents\_ | struct IAssetEventTracker.AssetEvent[] | Asset events array |

### getLatestAssetEvent

```solidity
function getLatestAssetEvent() external view returns (struct IAssetEventTracker.AssetEvent)
```

Return latest asset event

#### Return Values

| Name | Type                                 | Description                   |
| ---- | ------------------------------------ | ----------------------------- |
| [0]  | struct IAssetEventTracker.AssetEvent | Latest asset event registered |

### getCurrentState

```solidity
function getCurrentState() external view returns (uint256)
```

Return current state

#### Return Values

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| [0]  | uint256 | Latest state registered |

### isStateChangeAllowed

```solidity
function isStateChangeAllowed(uint256 _newState) external view returns (bool)
```

Return if state change is allowed

#### Parameters

| Name       | Type    | Description               |
| ---------- | ------- | ------------------------- |
| \_newState | uint256 | New asset state to change |

#### Return Values

| Name | Type | Description                 |
| ---- | ---- | --------------------------- |
| [0]  | bool | True or false if is allowed |
