## ClientFiltering

### registerFilter

```solidity
function registerFilter(struct IClientFiltering.Filter _filter) external
```

Registers a new filter configuration for client-side blockchain
transaction filtering

_Validates filter parameters against the specified FilterType and ensures
the filterId is unique before registration. Emits FilterRegistered event
upon successful registration_

#### Parameters

| Name     | Type                           | Description                                                                                               |
| -------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| \_filter | struct IClientFiltering.Filter | Complete filter configuration structure containing all necessary parameters for the specified filter type |

### updateFilter

```solidity
function updateFilter(struct IClientFiltering.Filter _filter) external
```

Updates an existing filter configuration with new parameters

_Validates filter parameters against the specified FilterType and updates
the filter configuration. Emits FilterUpdated event upon successful update_

#### Parameters

| Name     | Type                           | Description                            |
| -------- | ------------------------------ | -------------------------------------- |
| \_filter | struct IClientFiltering.Filter | Updated filter configuration structure |

### getFiltersLength

```solidity
function getFiltersLength() external view returns (uint256)
```

Retrieves the total number of filters currently registered in the system

_Useful for pagination calculations and determining the total filter count
for administrative purposes_

#### Return Values

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | uint256 | Total count of registered filters |

### getFiltersByPage

```solidity
function getFiltersByPage(uint256 _pageNumber, uint256 _pageSize) external view returns (struct IClientFiltering.Filter[] filters_)
```

Retrieves a paginated subset of registered filters for efficient
data access and client-side rendering

_Implements pagination to manage memory usage when dealing with large
numbers of registered filters. Page numbers are zero-indexed_

#### Parameters

| Name         | Type    | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| \_pageNumber | uint256 | Zero-indexed page number for pagination (starts from 0) |
| \_pageSize   | uint256 | Maximum number of filters to return per page            |

#### Return Values

| Name      | Type                             | Description                                                |
| --------- | -------------------------------- | ---------------------------------------------------------- |
| filters\_ | struct IClientFiltering.Filter[] | Array of Filter structures representing the requested page |

### isFilterRegistered

```solidity
function isFilterRegistered(bytes32 _filterId) external view returns (bool)
```

Checks whether a filter with the specified identifier exists in the
system

_Provides a gas-efficient way to verify filter existence before
performing operations that require the filter to exist_

#### Parameters

| Name       | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| \_filterId | bytes32 | Unique identifier of the filter to check |

#### Return Values

| Name | Type | Description                                                        |
| ---- | ---- | ------------------------------------------------------------------ |
| [0]  | bool | Boolean indicating whether the filter exists (true) or not (false) |

---

## ClientFilteringFacet

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

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

---

## ClientFilteringInternal

### ClientFilteringStorage

```solidity
struct ClientFilteringStorage {
  struct IClientFiltering.Filter[] clientFilters;
  mapping(bytes32 => bool) exists;
  mapping(bytes32 => uint256) filterIdPosition;
}
```

### validateFilter

```solidity
modifier validateFilter(struct IClientFiltering.Filter _filter)
```

### onlyUniqueFilterId

```solidity
modifier onlyUniqueFilterId(bytes32 _filterId)
```

### filterExists

```solidity
modifier filterExists(bytes32 _filterId)
```

### \_registerFilter

```solidity
function _registerFilter(struct IClientFiltering.Filter _newState) internal virtual
```

### \_updateFilter

```solidity
function _updateFilter(struct IClientFiltering.Filter _newState) internal virtual
```

### \_getFiltersLength

```solidity
function _getFiltersLength() internal view returns (uint256)
```

### \_getFiltersByPage

```solidity
function _getFiltersByPage(uint256 _page, uint256 _pageSize) internal view virtual returns (struct IClientFiltering.Filter[] filters_)
```

### \_isFilterRegistered

```solidity
function _isFilterRegistered(bytes32 _filterId) internal view returns (bool)
```

---

## IClientFiltering

Defines the structure and behaviour for managing blockchain transaction and
contract interaction filters in a decentralised client environment

_This interface enables granular filtering of blockchain activity through multiple
filter types including transaction hashes, contract addresses, function signatures,
and JSON-RPC methods. Filters are organised by block ranges for temporal filtering_

### FilterType

Enumeration of available filter types for client-side filtering operations

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
enum FilterType {
    NONE,
    TRANSACTION_HASH,
    CONTRACT,
    SIGNATURE,
    CONTRACT_AND_SIGNATURE,
    JSONRPC_METHOD
}
```

### Filter

Structure representing a comprehensive filter configuration for blockchain
transaction monitoring and client-side filtering

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct Filter {
  bytes32 filterId;
  enum IClientFiltering.FilterType filterType;
  bytes32 transactionHash;
  address contractAddress;
  bytes4 signature;
  bytes32 jsonRpcMethod;
  uint256 initialBlock;
  uint256 endBlock;
  bool disabled;
}
```

### FilterRegistered

```solidity
event FilterRegistered(bytes32 filterId, enum IClientFiltering.FilterType filterType, bytes32 transactionHash, address contractAddress, bytes4 signature, bytes32 jsonRpcMethod, uint256 initialBlock, uint256 endBlock, bool disabled)
```

Emitted when a new filter is successfully registered in the system

#### Parameters

| Name            | Type                             | Description                                                |
| --------------- | -------------------------------- | ---------------------------------------------------------- |
| filterId        | bytes32                          | Unique identifier of the registered filter                 |
| filterType      | enum IClientFiltering.FilterType | Type of filtering applied from FilterType enumeration      |
| transactionHash | bytes32                          | Transaction hash criteria (if applicable to filter type)   |
| contractAddress | address                          | Contract address criteria (if applicable to filter type)   |
| signature       | bytes4                           | Function signature criteria (if applicable to filter type) |
| jsonRpcMethod   | bytes32                          | JSON-RPC method criteria (if applicable to filter type)    |
| initialBlock    | uint256                          | Starting block number for the filter's active range        |
| endBlock        | uint256                          | Ending block number for the filter's active range          |
| disabled        | bool                             | Flag indicating if the filter is disabled                  |

### FilterUpdated

```solidity
event FilterUpdated(bytes32 filterId, enum IClientFiltering.FilterType filterType, bytes32 transactionHash, address contractAddress, bytes4 signature, bytes32 jsonRpcMethod, uint256 initialBlock, uint256 endBlock, bool disabled)
```

Emitted when an existing filter is updated in the system

#### Parameters

| Name            | Type                             | Description                                          |
| --------------- | -------------------------------- | ---------------------------------------------------- |
| filterId        | bytes32                          | Unique identifier of the updated filter              |
| filterType      | enum IClientFiltering.FilterType | Updated filter type from FilterType enumeration      |
| transactionHash | bytes32                          | Updated transaction hash criteria (if applicable)    |
| contractAddress | address                          | Updated contract address criteria (if applicable)    |
| signature       | bytes4                           | Updated function signature criteria (if applicable)  |
| jsonRpcMethod   | bytes32                          | Updated JSON-RPC method criteria (if applicable)     |
| initialBlock    | uint256                          | Updated starting block number for the filter's range |
| endBlock        | uint256                          | Updated ending block number for the filter's range   |
| disabled        | bool                             | Updated flag indicating if the filter is disabled    |

### InvalidFilter

```solidity
error InvalidFilter(bytes32 filterId, enum IClientFiltering.FilterType filterType, bytes32 transactionHash, address contractAddress, bytes4 signature, bytes32 jsonRpcMethod, uint256 initialBlock, uint256 endBlock, bool disabled)
```

Thrown when attempting to register a filter with invalid parameters or
configuration that does not match the specified filter type requirements

_This error ensures filter integrity by validating that required fields
are populated based on the selected FilterType_

#### Parameters

| Name            | Type                             | Description                                  |
| --------------- | -------------------------------- | -------------------------------------------- |
| filterId        | bytes32                          | The filter identifier that failed validation |
| filterType      | enum IClientFiltering.FilterType | The attempted filter type                    |
| transactionHash | bytes32                          | Transaction hash parameter provided          |
| contractAddress | address                          | Contract address parameter provided          |
| signature       | bytes4                           | Function signature parameter provided        |
| jsonRpcMethod   | bytes32                          | JSON-RPC method parameter provided           |
| initialBlock    | uint256                          | Initial block parameter provided             |
| endBlock        | uint256                          | End block parameter provided                 |
| disabled        | bool                             | Disabled flag parameter provided             |

### FilterIdExists

```solidity
error FilterIdExists(bytes32 filterId)
```

Thrown when attempting to register a filter with an identifier that
already exists in the system

_Ensures filter uniqueness and prevents accidental overwrites of existing
filter configurations_

#### Parameters

| Name     | Type    | Description                                               |
| -------- | ------- | --------------------------------------------------------- |
| filterId | bytes32 | The duplicate filter identifier that caused the collision |

### FilterNotFound

```solidity
error FilterNotFound(bytes32 filterId)
```

Thrown when attempting to access or modify a filter that does not exist

#### Parameters

| Name     | Type    | Description                        |
| -------- | ------- | ---------------------------------- |
| filterId | bytes32 | The non-existent filter identifier |

### registerFilter

```solidity
function registerFilter(struct IClientFiltering.Filter _filter) external
```

Registers a new filter configuration for client-side blockchain
transaction filtering

_Validates filter parameters against the specified FilterType and ensures
the filterId is unique before registration. Emits FilterRegistered event
upon successful registration_

#### Parameters

| Name     | Type                           | Description                                                                                               |
| -------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| \_filter | struct IClientFiltering.Filter | Complete filter configuration structure containing all necessary parameters for the specified filter type |

### updateFilter

```solidity
function updateFilter(struct IClientFiltering.Filter _filter) external
```

Updates an existing filter configuration with new parameters

_Validates filter parameters against the specified FilterType and updates
the filter configuration. Emits FilterUpdated event upon successful update_

#### Parameters

| Name     | Type                           | Description                            |
| -------- | ------------------------------ | -------------------------------------- |
| \_filter | struct IClientFiltering.Filter | Updated filter configuration structure |

### getFiltersLength

```solidity
function getFiltersLength() external view returns (uint256)
```

Retrieves the total number of filters currently registered in the system

_Useful for pagination calculations and determining the total filter count
for administrative purposes_

#### Return Values

| Name | Type    | Description                       |
| ---- | ------- | --------------------------------- |
| [0]  | uint256 | Total count of registered filters |

### getFiltersByPage

```solidity
function getFiltersByPage(uint256 _pageNumber, uint256 _pageSize) external view returns (struct IClientFiltering.Filter[] filters_)
```

Retrieves a paginated subset of registered filters for efficient
data access and client-side rendering

_Implements pagination to manage memory usage when dealing with large
numbers of registered filters. Page numbers are zero-indexed_

#### Parameters

| Name         | Type    | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| \_pageNumber | uint256 | Zero-indexed page number for pagination (starts from 0) |
| \_pageSize   | uint256 | Maximum number of filters to return per page            |

#### Return Values

| Name      | Type                             | Description                                                |
| --------- | -------------------------------- | ---------------------------------------------------------- |
| filters\_ | struct IClientFiltering.Filter[] | Array of Filter structures representing the requested page |

### isFilterRegistered

```solidity
function isFilterRegistered(bytes32 _filterId) external view returns (bool)
```

Checks whether a filter with the specified identifier exists in the
system

_Provides a gas-efficient way to verify filter existence before
performing operations that require the filter to exist_

#### Parameters

| Name       | Type    | Description                              |
| ---------- | ------- | ---------------------------------------- |
| \_filterId | bytes32 | Unique identifier of the filter to check |

#### Return Values

| Name | Type | Description                                                        |
| ---- | ---- | ------------------------------------------------------------------ |
| [0]  | bool | Boolean indicating whether the filter exists (true) or not (false) |
