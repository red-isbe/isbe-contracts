## INetworkDirectory

Interface for managing a decentralised directory of blockchain networks and their resources

_This interface provides CRUD operations for networks and their associated resources.
Networks are identified by chainId and can have multiple resources (RPC endpoints, explorers, etc.)_

### NetworkCreated

```solidity
event NetworkCreated(struct NetworkData network)
```

Emitted when a new network is successfully created

#### Parameters

| Name    | Type               | Description                                   |
| ------- | ------------------ | --------------------------------------------- |
| network | struct NetworkData | The complete network data including resources |

### NetworkUpdated

```solidity
event NetworkUpdated(struct UpdateNetworkData network)
```

Emitted when an existing network is updated

#### Parameters

| Name    | Type                     | Description              |
| ------- | ------------------------ | ------------------------ |
| network | struct UpdateNetworkData | The updated network data |

### NetworkDeleted

```solidity
event NetworkDeleted(uint256 chainId)
```

Emitted when a network is deleted from the directory

#### Parameters

| Name    | Type    | Description                                  |
| ------- | ------- | -------------------------------------------- |
| chainId | uint256 | The unique identifier of the deleted network |

### ResourceSet

```solidity
event ResourceSet(uint256 chainId, bytes32 resourceId, string resource)
```

Emitted when a resource is set or updated for a network

#### Parameters

| Name       | Type    | Description                       |
| ---------- | ------- | --------------------------------- |
| chainId    | uint256 | The network identifier            |
| resourceId | bytes32 | The resource type identifier      |
| resource   | string  | The resource content that was set |

### ResourceDeleted

```solidity
event ResourceDeleted(uint256 chainId, bytes32 resourceId)
```

Emitted when a resource is deleted from a network

#### Parameters

| Name       | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| chainId    | uint256 | The network identifier                        |
| resourceId | bytes32 | The resource type identifier that was deleted |

### createNetwork

```solidity
function createNetwork(struct NetworkData network) external
```

Creates a new network in the directory

_The network chainId must be unique and greater than 0_

#### Parameters

| Name    | Type               | Description                |
| ------- | ------------------ | -------------------------- |
| network | struct NetworkData | The network data to create |

### updateNetwork

```solidity
function updateNetwork(struct UpdateNetworkData network) external
```

Updates an existing network's information

_The chainId in the path must match the chainId in the network data_

#### Parameters

| Name    | Type                     | Description              |
| ------- | ------------------------ | ------------------------ |
| network | struct UpdateNetworkData | The updated network data |

### deleteNetwork

```solidity
function deleteNetwork(uint256 chainId) external
```

Deletes a network and all its associated resources from the directory

_This operation is irreversible and will remove all network resources_

#### Parameters

| Name    | Type    | Description                                    |
| ------- | ------- | ---------------------------------------------- |
| chainId | uint256 | The unique identifier of the network to delete |

### setResource

```solidity
function setResource(uint256 chainId, bytes32 resourceId, string resource) external
```

Sets or updates a resource for a specific network

_If the resourceId doesn't exist, it will be created. If it exists, it will be updated_

#### Parameters

| Name       | Type    | Description                                                           |
| ---------- | ------- | --------------------------------------------------------------------- |
| chainId    | uint256 | The network identifier where the resource will be set                 |
| resourceId | bytes32 | The unique identifier for the resource type (e.g., "RPC", "EXPLORER") |
| resource   | string  | The resource content (typically a URL or endpoint)                    |

### deleteResource

```solidity
function deleteResource(uint256 chainId, bytes32 resourceId) external
```

Deletes a specific resource from a network

_Removes the resource completely from the network_

#### Parameters

| Name       | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| chainId    | uint256 | The network identifier from which to delete the resource |
| resourceId | bytes32 | The unique identifier of the resource to delete          |

### getNetwork

```solidity
function getNetwork(uint256 chainId) external view returns (struct NetworkData network)
```

Retrieves a specific network by its chainId

_Returns the complete network information including all resources_

#### Parameters

| Name    | Type    | Description                                      |
| ------- | ------- | ------------------------------------------------ |
| chainId | uint256 | The unique identifier of the network to retrieve |

#### Return Values

| Name    | Type               | Description                                   |
| ------- | ------------------ | --------------------------------------------- |
| network | struct NetworkData | The complete network data including resources |

### getAllNetworks

```solidity
function getAllNetworks() external view returns (struct NetworkData[] networks)
```

Retrieves all networks in the directory

_Returns an array of all registered networks with their resources_

#### Return Values

| Name     | Type                 | Description                                    |
| -------- | -------------------- | ---------------------------------------------- |
| networks | struct NetworkData[] | Array containing all networks in the directory |

### getNetworksByAlgorithm

```solidity
function getNetworksByAlgorithm(enum Algorithm algorithm) external view returns (struct NetworkData[] networks)
```

Retrieves all networks that use a specific cryptographic algorithm

_Filters networks by algorithm field and returns matches with resources_

#### Parameters

| Name      | Type           | Description                                                  |
| --------- | -------------- | ------------------------------------------------------------ |
| algorithm | enum Algorithm | The cryptographic algorithm to filter by (e.g., "secp256r1") |

#### Return Values

| Name     | Type                 | Description                                     |
| -------- | -------------------- | ----------------------------------------------- |
| networks | struct NetworkData[] | Array of networks using the specified algorithm |

### getNetworksPaginated

```solidity
function getNetworksPaginated(uint256 pageSize, uint256 pageIndex) external view returns (struct NetworkData[] networks, uint256 totalCount, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated networks from the directory

_Returns a subset of networks with pagination details_

#### Parameters

| Name      | Type    | Description                   |
| --------- | ------- | ----------------------------- |
| pageSize  | uint256 | Number of networks per page   |
| pageIndex | uint256 | Index of the page to retrieve |

#### Return Values

| Name       | Type                 | Description                                  |
| ---------- | -------------------- | -------------------------------------------- |
| networks   | struct NetworkData[] | Array of networks for the requested page     |
| totalCount | uint256              | Total number of networks in the directory    |
| howMany    | uint256              | Number of items returned in the current page |
| prev       | uint256              | Previous page index (clamped to first page)  |
| next       | uint256              | Next page index (clamped to last page)       |

### getNetworksCount

```solidity
function getNetworksCount() external view returns (uint256 count)
```

Gets the total count of networks in the directory

_Efficient way to get total count without fetching all data_

#### Return Values

| Name  | Type    | Description                         |
| ----- | ------- | ----------------------------------- |
| count | uint256 | Total number of networks registered |

### getResourceKeys

```solidity
function getResourceKeys(uint256 chainId) external view returns (bytes32[] resourceIds)
```

Lists all resource identifiers available for a specific network

_Returns an array of all resourceIds that have been set for the network_

#### Parameters

| Name    | Type    | Description                                  |
| ------- | ------- | -------------------------------------------- |
| chainId | uint256 | The network identifier to list resources for |

#### Return Values

| Name        | Type      | Description                                             |
| ----------- | --------- | ------------------------------------------------------- |
| resourceIds | bytes32[] | Array of resource identifiers available for the network |

### getResourceKeysPaginated

```solidity
function getResourceKeysPaginated(uint256 chainId, uint256 pageSize, uint256 pageIndex) external view returns (bytes32[] resourceIds, uint256 totalCount, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated resource identifiers for a specific network

_Returns a subset of resource identifiers with pagination details_

#### Parameters

| Name      | Type    | Description                                  |
| --------- | ------- | -------------------------------------------- |
| chainId   | uint256 | The network identifier to list resources for |
| pageSize  | uint256 | Number of resource identifiers per page      |
| pageIndex | uint256 | Index of the page to retrieve                |

#### Return Values

| Name        | Type      | Description                                          |
| ----------- | --------- | ---------------------------------------------------- |
| resourceIds | bytes32[] | Array of resource identifiers for the requested page |
| totalCount  | uint256   | Total number of resources for the network            |
| howMany     | uint256   | Number of items returned in the current page         |
| prev        | uint256   | Previous page index (clamped to first page)          |
| next        | uint256   | Next page index (clamped to last page)               |

### getResourceCount

```solidity
function getResourceCount(uint256 chainId) external view returns (uint256 count)
```

Gets the total count of resources for a specific network

_Efficient way to get resource count without loading resource data_

#### Parameters

| Name    | Type    | Description                                   |
| ------- | ------- | --------------------------------------------- |
| chainId | uint256 | The network identifier to count resources for |

#### Return Values

| Name  | Type    | Description                               |
| ----- | ------- | ----------------------------------------- |
| count | uint256 | Total number of resources for the network |

---

## NetworkDirectory

External layer providing access-controlled network directory operations

_This abstract contract implements the public interface for network directory management.
It adds access control, pause functionality, and validation to the internal operations.
All functions require the NETWORK_DIRECTORY_ROLE and respect the contract pause state._

### createNetwork

```solidity
function createNetwork(struct NetworkData network) external
```

Creates a new network in the directory

_Validates network data, checks pause state, and requires NETWORK_DIRECTORY_ROLE_

#### Parameters

| Name    | Type               | Description                                |
| ------- | ------------------ | ------------------------------------------ |
| network | struct NetworkData | The complete network information to create |

### updateNetwork

```solidity
function updateNetwork(struct UpdateNetworkData network) external
```

Updates an existing network in the directory

_Validates network data, checks pause state, and requires NETWORK_DIRECTORY_ROLE_

#### Parameters

| Name    | Type                     | Description                                                                        |
| ------- | ------------------------ | ---------------------------------------------------------------------------------- |
| network | struct UpdateNetworkData | The updated network information (resources are managed separately via setResource) |

### deleteNetwork

```solidity
function deleteNetwork(uint256 chainId) external
```

Deletes a network and all its resources from the directory

_Ensures network exists, checks pause state and permissions before deletion_

#### Parameters

| Name    | Type    | Description                                    |
| ------- | ------- | ---------------------------------------------- |
| chainId | uint256 | The unique identifier of the network to delete |

### setResource

```solidity
function setResource(uint256 chainId, bytes32 resourceId, string resource) external
```

Sets or updates a resource for a specific network

_Creates new resource or updates existing one, with access control and pause checks_

#### Parameters

| Name       | Type    | Description                                                           |
| ---------- | ------- | --------------------------------------------------------------------- |
| chainId    | uint256 | The network identifier to set the resource for                        |
| resourceId | bytes32 | The unique identifier for the resource type (e.g., "RPC", "EXPLORER") |
| resource   | string  | The resource content (typically a URL or endpoint string)             |

### deleteResource

```solidity
function deleteResource(uint256 chainId, bytes32 resourceId) external
```

Deletes a specific resource from a network

_Removes the resource with access control and pause checks_

#### Parameters

| Name       | Type    | Description                                        |
| ---------- | ------- | -------------------------------------------------- |
| chainId    | uint256 | The network identifier to delete the resource from |
| resourceId | bytes32 | The unique identifier of the resource to delete    |

### getNetwork

```solidity
function getNetwork(uint256 chainId) external view returns (struct NetworkData network)
```

Retrieves complete information for a specific network

_Returns network data including all associated resources. Returns empty/zero values if network doesn't exist._

#### Parameters

| Name    | Type    | Description                                      |
| ------- | ------- | ------------------------------------------------ |
| chainId | uint256 | The unique identifier of the network to retrieve |

#### Return Values

| Name    | Type               | Description                                                                                                     |
| ------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| network | struct NetworkData | Complete network information including resources array. Returns default empty NetworkData if network not found. |

### getAllNetworks

```solidity
function getAllNetworks() external view returns (struct NetworkData[] networks)
```

Retrieves all networks registered in the directory

_Returns complete network information including resources for all networks. Returns empty array
if no networks exist._

#### Return Values

| Name     | Type                 | Description                                                          |
| -------- | -------------------- | -------------------------------------------------------------------- |
| networks | struct NetworkData[] | Array of all registered networks with their complete resource arrays |

### getNetworksByAlgorithm

```solidity
function getNetworksByAlgorithm(enum Algorithm algorithm) external view returns (struct NetworkData[] networks)
```

Retrieves all networks using a specific cryptographic algorithm

_Filters networks by algorithm field and returns complete information including resources_

#### Parameters

| Name      | Type           | Description                                                                              |
| --------- | -------------- | ---------------------------------------------------------------------------------------- |
| algorithm | enum Algorithm | The cryptographic algorithm to filter by (EllipticType enum: SECP_256_K1 or SECP_256_R1) |

#### Return Values

| Name     | Type                 | Description                                                                               |
| -------- | -------------------- | ----------------------------------------------------------------------------------------- |
| networks | struct NetworkData[] | Array of networks using the specified algorithm. Returns empty array if no matches found. |

### getNetworksPaginated

```solidity
function getNetworksPaginated(uint256 pageSize, uint256 pageIndex) external view returns (struct NetworkData[] networks, uint256 totalCount, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated networks from the directory

_Returns a subset of networks with pagination metadata. Handles edge cases gracefully._

#### Parameters

| Name      | Type    | Description                                      |
| --------- | ------- | ------------------------------------------------ |
| pageSize  | uint256 | Maximum number of networks per page              |
| pageIndex | uint256 | Index of the page to retrieve (1-based indexing) |

#### Return Values

| Name       | Type                 | Description                                                                        |
| ---------- | -------------------- | ---------------------------------------------------------------------------------- |
| networks   | struct NetworkData[] | Array of networks for the requested page (may be empty if offset exceeds count)    |
| totalCount | uint256              | Total number of networks in the directory                                          |
| howMany    | uint256              | Actual number of networks returned in the current page (0 if offset exceeds total) |
| prev       | uint256              | Previous page index (clamped to first page, minimum 1)                             |
| next       | uint256              | Next page index (clamped to last available page)                                   |

### getNetworksCount

```solidity
function getNetworksCount() external view returns (uint256 count)
```

Gets the total count of networks in the directory

_Efficient way to determine pagination parameters without loading data. Returns 0 if directory is empty._

#### Return Values

| Name  | Type    | Description                                                       |
| ----- | ------- | ----------------------------------------------------------------- |
| count | uint256 | Total number of networks registered in the directory (0 if empty) |

### getResourceKeys

```solidity
function getResourceKeys(uint256 chainId) external view returns (bytes32[] resourceIds)
```

Lists all resource identifiers for a specific network

_Returns array of resourceIds that have been set for the network. Returns empty array for non-existent
networks or networks without resources._

#### Parameters

| Name    | Type    | Description                                  |
| ------- | ------- | -------------------------------------------- |
| chainId | uint256 | The network identifier to list resources for |

#### Return Values

| Name        | Type      | Description                                                                                                        |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| resourceIds | bytes32[] | Array of resource identifiers (bytes32) for the network. Empty array if network doesn't exist or has no resources. |

### getResourceKeysPaginated

```solidity
function getResourceKeysPaginated(uint256 chainId, uint256 pageSize, uint256 pageIndex) external view returns (bytes32[] resourceIds, uint256 totalCount, uint256 howMany, uint256 prev, uint256 next)
```

Retrieves paginated resource identifiers for a specific network

_Returns a subset of resource keys with pagination metadata. Handles edge cases gracefully._

#### Parameters

| Name      | Type    | Description                                      |
| --------- | ------- | ------------------------------------------------ |
| chainId   | uint256 | The network identifier to list resources for     |
| pageSize  | uint256 | Maximum number of resource keys per page         |
| pageIndex | uint256 | Index of the page to retrieve (1-based indexing) |

#### Return Values

| Name        | Type      | Description                                                                                                              |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| resourceIds | bytes32[] | Array of resource identifiers (bytes32) for the requested page (empty if offset exceeds count or network not configured) |
| totalCount  | uint256   | Total number of resources for the network (0 if network doesn't exist or has no resources)                               |
| howMany     | uint256   | Actual number of resources returned in the current page (0 if offset exceeds total)                                      |
| prev        | uint256   | Previous page index (clamped to first page, minimum 1)                                                                   |
| next        | uint256   | Next page index (clamped to last available page)                                                                         |

### getResourceCount

```solidity
function getResourceCount(uint256 chainId) external view returns (uint256 count)
```

Gets the total count of resources for a specific network

_Efficient way to determine resource pagination parameters without loading data.
npReturns 0 for non-existent networks or networks without resources._

#### Parameters

| Name    | Type    | Description                                   |
| ------- | ------- | --------------------------------------------- |
| chainId | uint256 | The network identifier to count resources for |

#### Return Values

| Name  | Type    | Description                                                                                |
| ----- | ------- | ------------------------------------------------------------------------------------------ |
| count | uint256 | Total number of resources for the network (0 if network doesn't exist or has no resources) |

---

## NetworkDirectoryFacet

Diamond facet implementing network directory functionality with EIP-2535 introspection

_This contract serves as a diamond facet for the network directory system.
It combines the NetworkDirectory functionality with EIP-2535 introspection capabilities
to support diamond proxy pattern deployment and management._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this facet

_Used for EIP-165 interface detection in diamond proxies_

#### Return Values

| Name         | Type     | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| interfaces\_ | bytes4[] | Array of interface IDs implemented by this facet |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Returns the business identifier for this facet

_Used for facet identification and resolution in diamond architecture_

#### Return Values

| Name         | Type    | Description                                                        |
| ------------ | ------- | ------------------------------------------------------------------ |
| businessId\_ | bytes32 | The unique business identifier for network directory functionality |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Returns all function selectors implemented by this facet

_Used by diamond proxy for function routing and facet management_

#### Return Values

| Name        | Type     | Description                                                  |
| ----------- | -------- | ------------------------------------------------------------ |
| selectors\_ | bytes4[] | Array of 4-byte function selectors implemented by this facet |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

Returns the interfaces implemented by this contract

_Internal function used by interfacesIntrospection for EIP-165 support_

#### Return Values

| Name         | Type     | Description                                         |
| ------------ | -------- | --------------------------------------------------- |
| interfaces\_ | bytes4[] | Array containing the INetworkDirectory interface ID |

---

## NetworkDirectoryInternal

Internal implementation of network directory operations using diamond storage pattern

_This contract provides the core business logic for network directory management.
Uses diamond storage pattern to avoid storage collisions in proxy contracts.
All functions are internal and should be called through the external layer._

### ChainIdData

Holds network data and associated resources for a specific chain ID

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct ChainIdData {
  struct NetworkStorageData network;
  struct EnumerableSet.Bytes32Set resourceIds;
  mapping(bytes32 => string) resources;
}
```

### NetworkDirectoryStorage

Main storage structure for network directory data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct NetworkDirectoryStorage {
  struct EnumerableSet.UintSet chainIds;
  mapping(enum Algorithm => uint256) networksByAlgorithm;
  mapping(uint256 => struct NetworkDirectoryInternal.ChainIdData) networkData;
}
```

### onlyExistentNetwork

```solidity
modifier onlyExistentNetwork(uint256 chainId)
```

Ensures a network exists before operations

_Checks if chainId exists in storage by verifying stored chainId is not zero_

#### Parameters

| Name    | Type    | Description                        |
| ------- | ------- | ---------------------------------- |
| chainId | uint256 | The network identifier to validate |

### onlyNonExistentNetwork

```solidity
modifier onlyNonExistentNetwork(uint256 chainId)
```

Ensures a network does not exist before operations

_Checks if chainId is not registered by verifying stored chainId is zero_

#### Parameters

| Name    | Type    | Description                        |
| ------- | ------- | ---------------------------------- |
| chainId | uint256 | The network identifier to validate |

### onlyExistentResource

```solidity
modifier onlyExistentResource(uint256 chainId, bytes32 resourceId)
```

Ensures a resource exists for a network before operations

_Validates that the specified resourceId is associated with the chainId_

#### Parameters

| Name       | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| chainId    | uint256 | The network identifier              |
| resourceId | bytes32 | The resource identifier to validate |

### validateCreateNetworkData

```solidity
modifier validateCreateNetworkData(struct NetworkData network)
```

Modifier to validate network data before creation or updates

_Performs comprehensive validation of all network fields_

#### Parameters

| Name    | Type               | Description                  |
| ------- | ------------------ | ---------------------------- |
| network | struct NetworkData | The network data to validate |

### validateUpdateNetworkData

```solidity
modifier validateUpdateNetworkData(struct UpdateNetworkData network)
```

Ensures a resource exists for a network before operations

_Validates that the specified resourceId is associated with the chainId_

#### Parameters

| Name    | Type                     | Description                  |
| ------- | ------------------------ | ---------------------------- |
| network | struct UpdateNetworkData | The network data to validate |

### \_createNetwork

```solidity
function _createNetwork(struct NetworkData network) internal
```

### \_updateNetwork

```solidity
function _updateNetwork(struct UpdateNetworkData network) internal
```

### \_deleteNetwork

```solidity
function _deleteNetwork(uint256 chainId) internal
```

### \_setResource

```solidity
function _setResource(uint256 chainId, bytes32 resourceId, string resource) internal
```

### \_deleteResource

```solidity
function _deleteResource(uint256 chainId, bytes32 resourceId) internal
```

### \_getNetwork

```solidity
function _getNetwork(uint256 chainId) internal view returns (struct NetworkData networkData)
```

### \_getAllNetworks

```solidity
function _getAllNetworks() internal view returns (struct NetworkData[] networks_)
```

### \_getNetworksByAlgorithm

```solidity
function _getNetworksByAlgorithm(enum Algorithm algorithm) internal view returns (struct NetworkData[] networks_)
```

### \_getResourceKeys

```solidity
function _getResourceKeys(uint256 chainId) internal view returns (bytes32[])
```

### \_getNetworksPaginated

```solidity
function _getNetworksPaginated(uint256 pageSize, uint256 pageIndex) internal view returns (struct NetworkData[] networks, uint256 totalCount, uint256 howMany, uint256 prev, uint256 next)
```

### \_getNetworksCount

```solidity
function _getNetworksCount() internal view returns (uint256 count)
```

Internal function to get total count of networks

_Efficient way to get count without loading all network data_

#### Return Values

| Name  | Type    | Description                               |
| ----- | ------- | ----------------------------------------- |
| count | uint256 | Total number of networks in the directory |

### \_getResourceKeysPaginated

```solidity
function _getResourceKeysPaginated(uint256 chainId, uint256 pageSize, uint256 pageIndex) internal view returns (bytes32[] resourceIds, uint256 totalCount, uint256 howMany, uint256 prev, uint256 next)
```

### \_getResourceCount

```solidity
function _getResourceCount(uint256 chainId) internal view returns (uint256 count)
```

Internal function to get total count of resources for a network

_Efficient way to get resource count without loading resource data_

#### Parameters

| Name    | Type    | Description                                   |
| ------- | ------- | --------------------------------------------- |
| chainId | uint256 | The network identifier to count resources for |

#### Return Values

| Name  | Type    | Description                               |
| ----- | ------- | ----------------------------------------- |
| count | uint256 | Total number of resources for the network |
