## IProxyFactory

Interface for deploying and managing diamond proxy contracts

_Provides functionality to deploy use-case proxies with business logic
facets and manage their configurations through diamond patterns_

### UseCaseDeployed

```solidity
event UseCaseDeployed(bytes32 configurationId, uint256 version, struct IAccessControl.Rbac[] rbacs, address proxy)
```

Emitted when a new use-case proxy is successfully deployed

#### Parameters

| Name            | Type                         | Description                                       |
| --------------- | ---------------------------- | ------------------------------------------------- |
| configurationId | bytes32                      | The unique identifier for the configuration       |
| version         | uint256                      | The version number of the configuration used      |
| rbacs           | struct IAccessControl.Rbac[] | Array of role-based access control configurations |
| proxy           | address                      | The address of the deployed proxy contract        |

### NotEmptyBusinessIds

```solidity
error NotEmptyBusinessIds()
```

Reverted when attempting to deploy a diamond proxy with an
empty list of business IDs

### ForbiddenRole

```solidity
error ForbiddenRole(bytes32 role)
```

Reverted when a caller attempts an action with a role that is
not permitted

#### Parameters

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| role | bytes32 | The specific role that was found to be unauthorised |

### FacetNotPermitted

```solidity
error FacetNotPermitted(bytes32 businessId)
```

Reverted if a requested facet is not on the list of permitted
facets for deployment

#### Parameters

| Name       | Type    | Description                                       |
| ---------- | ------- | ------------------------------------------------- |
| businessId | bytes32 | The identifier of the facet that is not permitted |

### DuplicatedBusinessId

```solidity
error DuplicatedBusinessId(bytes32 businessId)
```

Reverted if the list of business logic identifiers contains
a duplicate entry

#### Parameters

| Name       | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| businessId | bytes32 | The identifier that was duplicated in the list |

### CurrentIdNotRegistered

```solidity
error CurrentIdNotRegistered(bytes32 businessId)
```

Reverted if a specified business logic identifier has not been
registered with the factory

#### Parameters

| Name       | Type    | Description                 |
| ---------- | ------- | --------------------------- |
| businessId | bytes32 | The unregistered identifier |

### FacetNotFound

```solidity
error FacetNotFound(bytes32 businessId)
```

Reverted during diamond deployment if the specified
initialisation facet is not in the list of facets being deployed

#### Parameters

| Name       | Type    | Description                                                   |
| ---------- | ------- | ------------------------------------------------------------- |
| businessId | bytes32 | The identifier of the initialisation facet that was not found |

### deployUseCase

```solidity
function deployUseCase(bytes32 configurationId, uint256 version, struct IAccessControl.Rbac[] rbacs, bytes32 initBusinessId, bytes initData) external
```

Deploys a new use-case proxy with the specified configuration

_Creates a diamond proxy with business logic facets and access
control, then initialises it with the provided data_

#### Parameters

| Name            | Type                         | Description                                            |
| --------------- | ---------------------------- | ------------------------------------------------------ |
| configurationId | bytes32                      | The unique identifier for the configuration            |
| version         | uint256                      | The version number of the configuration (0 for latest) |
| rbacs           | struct IAccessControl.Rbac[] | Array of role-based access control configurations      |
| initBusinessId  | bytes32                      | The business ID of the facet to use for init           |
| initData        | bytes                        | The calldata for the initialisation function           |

### getDeployedProxiesByConfiguration

```solidity
function getDeployedProxiesByConfiguration(bytes32 configurationId, uint256 version) external view returns (address[] proxies)
```

Retrieves all deployed proxies for a specific configuration

_Returns an array of proxy addresses that were deployed with the
given configuration and version_

#### Parameters

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| configurationId | bytes32 | The unique identifier for the configuration |
| version         | uint256 | The version number of the configuration     |

#### Return Values

| Name    | Type      | Description                       |
| ------- | --------- | --------------------------------- |
| proxies | address[] | Array of deployed proxy addresses |

### getConfigurationByProxy

```solidity
function getConfigurationByProxy(address proxy) external view returns (bytes32 configurationId, uint256 version)
```

Gets the configuration details for a specific proxy

_Returns the configuration ID and version used to deploy the proxy_

#### Parameters

| Name  | Type    | Description                                |
| ----- | ------- | ------------------------------------------ |
| proxy | address | The address of the deployed proxy contract |

#### Return Values

| Name            | Type    | Description                                 |
| --------------- | ------- | ------------------------------------------- |
| configurationId | bytes32 | The unique identifier for the configuration |
| version         | uint256 | The version number of the configuration     |

---

## ProxyFactory

Main contract for deploying diamond proxy contracts with business
logic configurations

_Inherits from ProxyFactoryInternal and implements the IProxyFactory
interface. Provides role-based access control for proxy deployment
and configuration management functionality_

### onlyValidConfiguration

```solidity
modifier onlyValidConfiguration(bytes32 _configurationId, uint256 _version)
```

_Modifier to validate that a configuration exists and is valid_

#### Parameters

| Name              | Type    | Description                                 |
| ----------------- | ------- | ------------------------------------------- |
| \_configurationId | bytes32 | The unique identifier for the configuration |
| \_version         | uint256 | The version number to validate              |

### deployUseCase

```solidity
function deployUseCase(bytes32 _configurationId, uint256 _version, struct IAccessControl.Rbac[] _rbacs, bytes32 _initBusinessId, bytes _initData) external
```

### getDeployedProxiesByConfiguration

```solidity
function getDeployedProxiesByConfiguration(bytes32 _configurationId, uint256 _version) external view returns (address[] proxies)
```

### getConfigurationByProxy

```solidity
function getConfigurationByProxy(address _proxy) external view returns (bytes32 configurationId, uint256 version)
```

---

## ProxyFactoryFacet

EIP-2535 diamond facet for proxy factory functionality

_Inherits from ProxyFactory and implements IEIP2535Introspection
interface. Designed to be deployed as a logic contract (facet) that
can be added to a diamond proxy. The constructor disables the
initialiser to prevent direct initialisation of this implementation_

### constructor

```solidity
constructor() public
```

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

---

## ProxyFactoryInternal

Abstract contract providing internal proxy factory functionality

_Inherits from ConfigurationManagementInternal and provides core
logic for deploying and managing ISBE proxy contracts. Contains
storage mappings and internal functions for proxy deployment_

### ProxyFactoryStorage

```solidity
struct ProxyFactoryStorage {
  mapping(bytes32 => mapping(uint256 => struct EnumerableSet.AddressSet)) configurationToProxyAddress;
  mapping(address => bytes32) proxyAddressToConfigurationId;
  mapping(address => uint256) proxyAddressToVersion;
}
```

### \_deployUseCase

```solidity
function _deployUseCase(bytes32 _configurationId, uint256 _version, struct IAccessControl.Rbac[] _rbacs, bytes32 _initBusinessId, bytes _initData) internal returns (address proxyAddress_)
```

### \_getDeployedProxiesByConfiguration

```solidity
function _getDeployedProxiesByConfiguration(bytes32 _configurationId, uint256 _version) internal view returns (address[] proxies_)
```

### \_getConfigurationByProxy

```solidity
function _getConfigurationByProxy(address _proxy) internal view returns (bytes32 configurationId_, uint256 version_)
```

### \_isProxyDeployed

```solidity
function _isProxyDeployed(address _proxy) internal view returns (bool deployed_)
```

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```
