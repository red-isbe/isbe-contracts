## IProxyFactory

Defines a standard factory for deploying different kinds of proxy contracts,
including Transparent and Diamond proxies.

_This interface specifies the functions, events, and errors that a proxy factory must
implement. It provides a consistent API for creating and initialising complex proxy
setups, ensuring that any implementing contract is predictable and interoperable._

### DiamondDeployed

```solidity
event DiamondDeployed(bytes32[] businessIds, struct IAccessControl.Rbac[] rbacs, address proxy)
```

Emitted when a new diamond proxy has been successfully deployed and initialised.

#### Parameters

| Name        | Type                         | Description                                                                  |
| ----------- | ---------------------------- | ---------------------------------------------------------------------------- |
| businessIds | bytes32[]                    | Identifiers for all the business logic facets attached to the diamond.       |
| rbacs       | struct IAccessControl.Rbac[] | The Role-Based Access Control (RBAC) settings applied during initialisation. |
| proxy       | address                      | The address of the newly created diamond proxy contract.                     |

### NotEmptyBusinessIds

```solidity
error NotEmptyBusinessIds()
```

Reverted when attempting to deploy a diamond proxy with an empty list of business IDs.

### ForbiddenRole

```solidity
error ForbiddenRole(bytes32 role)
```

Reverted when a caller attempts an action with a role that is not permitted.

#### Parameters

| Name | Type    | Description                                          |
| ---- | ------- | ---------------------------------------------------- |
| role | bytes32 | The specific role that was found to be unauthorised. |

### FacetNotPermitted

```solidity
error FacetNotPermitted(bytes32 businessId)
```

Reverted if a requested facet is not on the list of permitted facets for deployment.

#### Parameters

| Name       | Type    | Description                                        |
| ---------- | ------- | -------------------------------------------------- |
| businessId | bytes32 | The identifier of the facet that is not permitted. |

### DuplicatedBusinessId

```solidity
error DuplicatedBusinessId(bytes32 businessId)
```

Reverted if the list of business logic identifiers contains a duplicate entry.

#### Parameters

| Name       | Type    | Description                                     |
| ---------- | ------- | ----------------------------------------------- |
| businessId | bytes32 | The identifier that was duplicated in the list. |

### CurrentIdNotRegistered

```solidity
error CurrentIdNotRegistered(bytes32 businessId)
```

Reverted if a specified business logic identifier has not been registered with the factory.

#### Parameters

| Name       | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| businessId | bytes32 | The unregistered identifier. |

### InitializationFacetNotFound

```solidity
error InitializationFacetNotFound(bytes32 businessId)
```

Reverted during diamond deployment if the specified initialisation facet is not
in the list of facets being deployed.

#### Parameters

| Name       | Type    | Description                                                    |
| ---------- | ------- | -------------------------------------------------------------- |
| businessId | bytes32 | The identifier of the initialisation facet that was not found. |

### deployDiamond

```solidity
function deployDiamond(bytes32[] businessIds, struct IAccessControl.Rbac[] rbacs, bytes32 initBusinessId, bytes initData) external
```

Deploys a new EIP-2535 Diamond proxy with a specified set of facets and access control.

_This function should handle the creation of a diamond proxy, attach a set of facets
(identified by `businessIds`), and configure the access control roles. It must also
be able to execute an initialisation function on one of the specified facets._

#### Parameters

| Name           | Type                         | Description                                                             |
| -------------- | ---------------------------- | ----------------------------------------------------------------------- |
| businessIds    | bytes32[]                    | A list of identifiers for the specific business logic facets to attach. |
| rbacs          | struct IAccessControl.Rbac[] | An array of access control roles to configure on the new diamond.       |
| initBusinessId | bytes32                      | The identifier of the facet that contains the initialisation function.  |
| initData       | bytes                        | The encoded call data for the initialisation function.                  |

### getDeployedProxiesByBusinessId

```solidity
function getDeployedProxiesByBusinessId(bytes32 businessId) external view returns (address[] proxies)
```

Finds all proxy addresses that have been deployed incorporating a specific business logic facet.

#### Parameters

| Name       | Type    | Description                                         |
| ---------- | ------- | --------------------------------------------------- |
| businessId | bytes32 | The identifier of the business logic to search for. |

#### Return Values

| Name    | Type      | Description                                                                 |
| ------- | --------- | --------------------------------------------------------------------------- |
| proxies | address[] | An array of deployed proxy addresses associated with the given business ID. |

### getBusinessIdsByProxy

```solidity
function getBusinessIdsByProxy(address proxy) external view returns (bytes32[] businessIds)
```

Retrieves all business logic identifiers associated with a specific deployed proxy address.

#### Parameters

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| proxy | address | The address of the deployed proxy to query. |

#### Return Values

| Name        | Type      | Description                                               |
| ----------- | --------- | --------------------------------------------------------- |
| businessIds | bytes32[] | An array of business IDs attached to the specified proxy. |

---

## ProxyFactory

This contract is the primary implementation of the IProxyFactory interface. It serves
as a factory for deploying and managing various types of proxy contracts, such as
Diamond proxies (EIP-2535).

_An upgradeable contract that provides the concrete logic for deploying proxies. It inherits
from ProxyFactoryInternal, which contains the core implementation details, and strictly
adheres to the IProxyFactory interface. Access to key functions is restricted through
role-based access control._

### deployDiamond

```solidity
function deployDiamond(bytes32[] businessIds, struct IAccessControl.Rbac[] rbacs, bytes32 initBusinessId, bytes initData) external
```

Deploys a new EIP-2535 Diamond proxy with a specified set of facets and access control.

_This function should handle the creation of a diamond proxy, attach a set of facets
(identified by `businessIds`), and configure the access control roles. It must also
be able to execute an initialisation function on one of the specified facets._

#### Parameters

| Name           | Type                         | Description                                                             |
| -------------- | ---------------------------- | ----------------------------------------------------------------------- |
| businessIds    | bytes32[]                    | A list of identifiers for the specific business logic facets to attach. |
| rbacs          | struct IAccessControl.Rbac[] | An array of access control roles to configure on the new diamond.       |
| initBusinessId | bytes32                      | The identifier of the facet that contains the initialisation function.  |
| initData       | bytes                        | The encoded call data for the initialisation function.                  |

### getDeployedProxiesByBusinessId

```solidity
function getDeployedProxiesByBusinessId(bytes32 businessId) external view returns (address[] proxies)
```

Finds all proxy addresses that have been deployed incorporating a specific business logic facet.

#### Parameters

| Name       | Type    | Description                                         |
| ---------- | ------- | --------------------------------------------------- |
| businessId | bytes32 | The identifier of the business logic to search for. |

#### Return Values

| Name    | Type      | Description                                                                 |
| ------- | --------- | --------------------------------------------------------------------------- |
| proxies | address[] | An array of deployed proxy addresses associated with the given business ID. |

### getBusinessIdsByProxy

```solidity
function getBusinessIdsByProxy(address proxy) external view returns (bytes32[] businessIds)
```

Retrieves all business logic identifiers associated with a specific deployed proxy address.

#### Parameters

| Name  | Type    | Description                                 |
| ----- | ------- | ------------------------------------------- |
| proxy | address | The address of the deployed proxy to query. |

#### Return Values

| Name        | Type      | Description                                               |
| ----------- | --------- | --------------------------------------------------------- |
| businessIds | bytes32[] | An array of business IDs attached to the specified proxy. |

---

## ProxyFactoryFacet

This contract serves as the EIP-2535 Diamond facet for the proxy factory functionality.
It exposes all the features of the ProxyFactory through a Diamond proxy.

_This contract inherits from ProxyFactory and implements the IEIP2535Introspection
interface. It is designed to be deployed as a logic contract (facet) that can be
added to a Diamond proxy. The constructor disables the initialiser to prevent this
implementation contract from being initialised directly; it must be done through
the storage context of a proxy._

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

This abstract contract contains the internal functions and storage for creating and
managing proxy contracts. It is not intended for direct deployment but serves as the
core implementation layer for the public-facing `ProxyFactory`.

_Implements the internal logic required by `ProxyFactory`. It manages storage using a
dedicated struct to prevent storage collisions in an upgradeable context. It inherits
from `BusinessLogicFactoryInternal` to access business logic registration and from
`InitializeBusinessLogic` for initialisation capabilities._

### ProxyFactoryStorage

_Defines the storage layout for the proxy factory. Using a struct at a fixed
storage slot helps prevent storage collisions across upgrades._

```solidity
struct ProxyFactoryStorage {
  mapping(bytes32 => struct EnumerableSet.AddressSet) businessIdToProxyAddress;
  mapping(address => struct EnumerableSet.Bytes32Set) proxyAddressToBusinessIds;
}
```

### \_deployDiamond

```solidity
function _deployDiamond(bytes32[] businessIds, struct IAccessControl.Rbac[] rbacs, bytes32 initBusinessId, bytes initData) internal returns (address proxyAddress)
```

### \_getDeployedProxiesByBusinessId

```solidity
function _getDeployedProxiesByBusinessId(bytes32 businessId) internal view returns (address[] proxies)
```

### \_getBusinessIdsByProxy

```solidity
function _getBusinessIdsByProxy(address proxy) internal view returns (bytes32[] businessIds)
```

### \_isProxyDeployed

```solidity
function _isProxyDeployed(address proxy) internal view returns (bool deployed_)
```

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```
