## ConfigurationManagement

Manages the configuration of different use cases. It maps business
logic facets to specific configurations, enabling versioning and the
dynamic upgrading of system capabilities.

_Implements `IConfigurationManagement`. It provides the public interface
for administrators to define and manage which facets are part of a given
use-case configuration. It relies on internal logic to handle storing
and retrieving these configurations._

### setConfiguration

```solidity
function setConfiguration(bytes32 configurationId, struct IConfigurationManagement.BusinessData[] businessIds) external
```

Registers or updates a versioned configuration of business logic facets.

#### Parameters

| Name            | Type                                           | Description                                               |
| --------------- | ---------------------------------------------- | --------------------------------------------------------- |
| configurationId | bytes32                                        | The unique identifier for the configuration.              |
| businessIds     | struct IConfigurationManagement.BusinessData[] | An array linking business logic IDs to specific versions. |

### getConfiguration

```solidity
function getConfiguration(bytes32 configurationId, uint256 version) external view returns (struct IConfigurationManagement.BusinessData[] businessData_)
```

Retrieves a configuration by its identifier and version.

#### Parameters

| Name            | Type    | Description                                                  |
| --------------- | ------- | ------------------------------------------------------------ |
| configurationId | bytes32 | The identifier of the configuration to retrieve.             |
| version         | uint256 | The version number. Use 0 for the latest recognised version. |

#### Return Values

| Name           | Type                                           | Description |
| -------------- | ---------------------------------------------- | ----------- |
| businessData\_ | struct IConfigurationManagement.BusinessData[] |             |

### checkConfiguration

```solidity
function checkConfiguration(bytes32 configurationId, uint256 version) external view
```

Checks that a specific configuration and version exist. Reverts if not.

#### Parameters

| Name            | Type    | Description                                                   |
| --------------- | ------- | ------------------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to validate.              |
| version         | uint256 | The version number to validate. Use 0 for the latest version. |

### facets

```solidity
function facets(bytes32 configurationId, uint256 version) external view returns (struct IDiamondLoupe.Facet[] facets_)
```

Retrieves detailed facet information, including all function selectors.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |

#### Return Values

| Name     | Type                         | Description |
| -------- | ---------------------------- | ----------- |
| facets\_ | struct IDiamondLoupe.Facet[] |             |

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(bytes32 configurationId, uint256 version, address facet) external view returns (bytes4[] facetFunctionSelectors_)
```

Gets all function selectors for a specific facet within a configuration.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |
| facet           | address | The address of the facet to inspect.              |

#### Return Values

| Name                     | Type     | Description                                  |
| ------------------------ | -------- | -------------------------------------------- |
| facetFunctionSelectors\_ | bytes4[] | An array of its `bytes4` function selectors. |

### facetAddresses

```solidity
function facetAddresses(bytes32 configurationId, uint256 version) external view returns (address[] facetAddresses_)
```

Gets all unique facet addresses for a given configuration version.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |

#### Return Values

| Name             | Type      | Description                         |
| ---------------- | --------- | ----------------------------------- |
| facetAddresses\_ | address[] | An array of unique facet addresses. |

### facetAddress

```solidity
function facetAddress(bytes32 configurationId, uint256 version, bytes4 functionSelector) external view returns (address facetAddress_)
```

Finds which facet a function selector belongs to in a configuration.

#### Parameters

| Name             | Type    | Description                                       |
| ---------------- | ------- | ------------------------------------------------- |
| configurationId  | bytes32 | The identifier of the configuration to query.     |
| version          | uint256 | The version number. Use 0 for the latest version. |
| functionSelector | bytes4  | The `bytes4` selector to find.                    |

#### Return Values

| Name           | Type    | Description                             |
| -------------- | ------- | --------------------------------------- |
| facetAddress\_ | address | The address of the corresponding facet. |

### facetSupportsInterface

```solidity
function facetSupportsInterface(bytes32 configurationId, uint256 version, bytes4 interfaceId) external view returns (bool supported_)
```

Checks if a configuration version supports a given EIP-165 interface.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |
| interfaceId     | bytes4  | The `bytes4` EIP-165 interface ID to check.       |

#### Return Values

| Name        | Type | Description                                                  |
| ----------- | ---- | ------------------------------------------------------------ |
| supported\_ | bool | Returns true if the interface is supported, otherwise false. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

---

## ConfigurationManagementFacet

An EIP-2535 facet for the configuration management system. This
contract exposes functions to define and query use-case configs.

_Inherits from `ConfigurationManagement` and implements the standard
EIP-2535 introspection interface. It makes the core configuration
logic available for use within a diamond proxy._

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

## ConfigurationManagementInternal

Handles the internal logic for creating and managing use-case configurations.

_This abstract contract provides the core storage and functions for use-case
configurations. It is designed to be inherited by a public-facing contract.
It manages versioning and the association of business logic facets._

### ConfigurationManagementStorage

```solidity
struct ConfigurationManagementStorage {
  mapping(bytes32 => uint256) latestVersion;
  mapping(bytes32 => mapping(uint256 => struct EnumerableSet.Bytes32Set)) businessIds;
  mapping(bytes32 => mapping(uint256 => mapping(bytes32 => uint256))) businessVersions;
  mapping(bytes32 => mapping(uint256 => struct EnumerableSet.AddressSet)) facetAddresses;
  mapping(bytes32 => mapping(uint256 => mapping(address => bytes4[]))) functionSelectors;
  mapping(bytes32 => mapping(uint256 => mapping(bytes4 => address))) selectorToFacet;
  mapping(bytes32 => mapping(uint256 => mapping(bytes4 => bool))) supportsInterface;
}
```

### \_setConfiguration

```solidity
function _setConfiguration(bytes32 configurationId, struct IConfigurationManagement.BusinessData[] businessData) internal returns (uint256 version_)
```

### \_getConfiguration

```solidity
function _getConfiguration(bytes32 configurationId, uint256 configurationVersion) internal view returns (struct IConfigurationManagement.BusinessData[] businessData_)
```

### \_checkConfiguration

```solidity
function _checkConfiguration(bytes32 configurationId, uint256 version) internal view
```

### \_existsConfiguration

```solidity
function _existsConfiguration(bytes32 configurationId, uint256 version) internal view returns (bool)
```

### \_getFacets

```solidity
function _getFacets(bytes32 configurationId, uint256 _version) internal view returns (struct IDiamondLoupe.Facet[] facets)
```

### \_facetFunctionSelectors

```solidity
function _facetFunctionSelectors(bytes32 configurationId, uint256 version, address facetAddress) internal view returns (bytes4[] facetFunctionSelectors_)
```

### \_facetAddresses

```solidity
function _facetAddresses(bytes32 configurationId, uint256 version) internal view returns (address[] facetAddresses_)
```

### \_facetAddress

```solidity
function _facetAddress(bytes32 configurationId, uint256 version, bytes4 functionSelector) internal view returns (address facetAddress_)
```

### \_facetSupportsInterface

```solidity
function _facetSupportsInterface(bytes32 configurationId, uint256 version, bytes4 interfaceId) internal view returns (bool supported_)
```

---

## IConfigurationManagement

Defines a standard for managing versioned business logic configurations.

_Provides an interface for configuration management within a Diamond proxy context,
allowing for the registration and retrieval of versioned sets of facets._

### BusinessData

Represents a specific version of a piece of business logic.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct BusinessData {
    bytes32 businessId;
    uint256 version;
}
```

### ConfigurationSet

```solidity
event ConfigurationSet(bytes32 configurationId, struct IConfigurationManagement.BusinessData[] businessData, uint256 version)
```

Emitted when a new configuration version is successfully set.

#### Parameters

| Name            | Type                                           | Description                                              |
| --------------- | ---------------------------------------------- | -------------------------------------------------------- |
| configurationId | bytes32                                        | The unique ID of the configuration being set.            |
| businessData    | struct IConfigurationManagement.BusinessData[] | The array of business logic making up the configuration. |
| version         | uint256                                        | The new version number assigned to this configuration.   |

### InvalidConfiguration

```solidity
error InvalidConfiguration(bytes32 configurationId, uint256 version)
```

Thrown when a requested configuration ID and version combination is not found.

#### Parameters

| Name            | Type    | Description                                     |
| --------------- | ------- | ----------------------------------------------- |
| configurationId | bytes32 | The ID of the configuration that was not found. |
| version         | uint256 | The version number that was not found.          |

### setConfiguration

```solidity
function setConfiguration(bytes32 configurationId, struct IConfigurationManagement.BusinessData[] businessIds) external
```

Registers or updates a versioned configuration of business logic facets.

#### Parameters

| Name            | Type                                           | Description                                               |
| --------------- | ---------------------------------------------- | --------------------------------------------------------- |
| configurationId | bytes32                                        | The unique identifier for the configuration.              |
| businessIds     | struct IConfigurationManagement.BusinessData[] | An array linking business logic IDs to specific versions. |

### getConfiguration

```solidity
function getConfiguration(bytes32 configurationId, uint256 version) external view returns (struct IConfigurationManagement.BusinessData[] businessData)
```

Retrieves a configuration by its identifier and version.

#### Parameters

| Name            | Type    | Description                                                  |
| --------------- | ------- | ------------------------------------------------------------ |
| configurationId | bytes32 | The identifier of the configuration to retrieve.             |
| version         | uint256 | The version number. Use 0 for the latest recognised version. |

#### Return Values

| Name         | Type                                           | Description                                                 |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------- |
| businessData | struct IConfigurationManagement.BusinessData[] | The array of business logic data for the specified version. |

### checkConfiguration

```solidity
function checkConfiguration(bytes32 configurationId, uint256 version) external view
```

Checks that a specific configuration and version exist. Reverts if not.

#### Parameters

| Name            | Type    | Description                                                   |
| --------------- | ------- | ------------------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to validate.              |
| version         | uint256 | The version number to validate. Use 0 for the latest version. |

### facets

```solidity
function facets(bytes32 configurationId, uint256 version) external view returns (struct IDiamondLoupe.Facet[] facets)
```

Retrieves detailed facet information, including all function selectors.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |

#### Return Values

| Name   | Type                         | Description                                                      |
| ------ | ---------------------------- | ---------------------------------------------------------------- |
| facets | struct IDiamondLoupe.Facet[] | An array of `IDiamondLoupe.Facet` structs for the configuration. |

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(bytes32 configurationId, uint256 version, address facet) external view returns (bytes4[] facetFunctionSelectors_)
```

Gets all function selectors for a specific facet within a configuration.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |
| facet           | address | The address of the facet to inspect.              |

#### Return Values

| Name                     | Type     | Description                                  |
| ------------------------ | -------- | -------------------------------------------- |
| facetFunctionSelectors\_ | bytes4[] | An array of its `bytes4` function selectors. |

### facetAddresses

```solidity
function facetAddresses(bytes32 configurationId, uint256 version) external view returns (address[] facetAddresses_)
```

Gets all unique facet addresses for a given configuration version.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |

#### Return Values

| Name             | Type      | Description                         |
| ---------------- | --------- | ----------------------------------- |
| facetAddresses\_ | address[] | An array of unique facet addresses. |

### facetAddress

```solidity
function facetAddress(bytes32 configurationId, uint256 version, bytes4 functionSelector) external view returns (address facetAddress_)
```

Finds which facet a function selector belongs to in a configuration.

#### Parameters

| Name             | Type    | Description                                       |
| ---------------- | ------- | ------------------------------------------------- |
| configurationId  | bytes32 | The identifier of the configuration to query.     |
| version          | uint256 | The version number. Use 0 for the latest version. |
| functionSelector | bytes4  | The `bytes4` selector to find.                    |

#### Return Values

| Name           | Type    | Description                             |
| -------------- | ------- | --------------------------------------- |
| facetAddress\_ | address | The address of the corresponding facet. |

### facetSupportsInterface

```solidity
function facetSupportsInterface(bytes32 configurationId, uint256 version, bytes4 interfaceId) external view returns (bool supported_)
```

Checks if a configuration version supports a given EIP-165 interface.

#### Parameters

| Name            | Type    | Description                                       |
| --------------- | ------- | ------------------------------------------------- |
| configurationId | bytes32 | The identifier of the configuration to query.     |
| version         | uint256 | The version number. Use 0 for the latest version. |
| interfaceId     | bytes4  | The `bytes4` EIP-165 interface ID to check.       |

#### Return Values

| Name        | Type | Description                                                  |
| ----------- | ---- | ------------------------------------------------------------ |
| supported\_ | bool | Returns true if the interface is supported, otherwise false. |
