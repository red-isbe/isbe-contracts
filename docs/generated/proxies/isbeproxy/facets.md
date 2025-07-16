## IsbeCutFacet

Diamond facet for managing ISBE proxy configurations

_Implements IIsbeCut interface within an EIP-2535 Diamond proxy system_

### setIsbeProxyConfiguration

```solidity
function setIsbeProxyConfiguration(contract IConfigurationManagement _configurationManagement, bytes32 _configurationId, uint256 _version) external
```

Sets the ISBE proxy configuration from an external management contract

_Updates the proxy configuration using the specified management contract_

#### Parameters

| Name                      | Type                              | Description                                      |
| ------------------------- | --------------------------------- | ------------------------------------------------ |
| \_configurationManagement | contract IConfigurationManagement | The configuration management contract instance   |
| \_configurationId         | bytes32                           | The identifier of the configuration to set       |
| \_version                 | uint256                           | The version number of the configuration to apply |

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

## IsbeLoupeFacet

Diamond facet providing introspection capabilities for ISBE proxies

_Implements Diamond Loupe functions for EIP-2535 compliance with ERC-165 support_

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

Gets all facets and their selectors.

#### Return Values

| Name     | Type                         | Description |
| -------- | ---------------------------- | ----------- |
| facets\_ | struct IDiamondLoupe.Facet[] | Facet       |

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] functionSelectors_)
```

Gets all the function selectors supported by a specific facet.

#### Parameters

| Name    | Type    | Description        |
| ------- | ------- | ------------------ |
| \_facet | address | The facet address. |

#### Return Values

| Name                | Type     | Description                                    |
| ------------------- | -------- | ---------------------------------------------- |
| functionSelectors\_ | bytes4[] | The selectors associated with a facet address. |

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

Get all the facet addresses used by a diamond.

#### Return Values

| Name             | Type      | Description |
| ---------------- | --------- | ----------- |
| facetAddresses\_ | address[] |             |

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

Gets the facet address that supports the given selector.

_If facet is not found return address(0)._

#### Parameters

| Name               | Type   | Description            |
| ------------------ | ------ | ---------------------- |
| \_functionSelector | bytes4 | The function selector. |

#### Return Values

| Name           | Type    | Description        |
| -------------- | ------- | ------------------ |
| facetAddress\_ | address | The facet address. |

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) external view virtual returns (bool)
```

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
