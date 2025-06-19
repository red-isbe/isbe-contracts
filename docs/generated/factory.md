## IGovernanceManagement

Interface for managing governance contract states (pause and unpause).

_Provides functions to pause and unpause proxy contracts, ensuring controlled management of their state._

### IsbePaused

```solidity
event IsbePaused(address proxyAddress)
```

Emitted when a proxy contract is paused.

_Indicates that the proxy contract is in a paused state._

#### Parameters

| Name         | Type    | Description                                             |
| ------------ | ------- | ------------------------------------------------------- |
| proxyAddress | address | The address of the proxy contract that has been paused. |

### IsbeUnpaused

```solidity
event IsbeUnpaused(address proxyAddress)
```

Emitted when a proxy contract is unpaused.

_Indicates that the proxy contract is active again and functional._

#### Parameters

| Name         | Type    | Description                                               |
| ------------ | ------- | --------------------------------------------------------- |
| proxyAddress | address | The address of the proxy contract that has been unpaused. |

### pause

```solidity
function pause(address proxyAddress) external
```

Pauses a specified proxy contract, disabling its functionality.

_Only callable by authorized roles, emits the `IsbePaused` event upon success._

#### Parameters

| Name         | Type    | Description                                 |
| ------------ | ------- | ------------------------------------------- |
| proxyAddress | address | The address of the proxy contract to pause. |

### unpause

```solidity
function unpause(address proxyAddress) external
```

Unpauses a specified proxy contract, enabling its functionality.

_Only callable by authorized roles, emits the `IsbeUnpaused` event upon success._

#### Parameters

| Name         | Type    | Description                                   |
| ------------ | ------- | --------------------------------------------- |
| proxyAddress | address | The address of the proxy contract to unpause. |

---

## IProxyFactory

Defines a standard factory for deploying different kinds of proxy contracts,
including Transparent and Diamond proxies.

_This interface specifies the functions, events, and errors that a proxy factory must
implement. It provides a consistent API for creating and initialising complex proxy
setups, ensuring that any implementing contract is predictable and interoperable._

### TransparentDeployed

```solidity
event TransparentDeployed(bytes32 businessId, struct IAccessControl.Rbac[] rbacs, address proxy)
```

Emitted when a new transparent proxy has been successfully deployed and initialised.

#### Parameters

| Name       | Type                         | Description                                                                  |
| ---------- | ---------------------------- | ---------------------------------------------------------------------------- |
| businessId | bytes32                      | A unique identifier for the business logic (implementation) contract.        |
| rbacs      | struct IAccessControl.Rbac[] | The Role-Based Access Control (RBAC) settings applied during initialisation. |
| proxy      | address                      | The address of the newly created transparent proxy contract.                 |

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

### initializeProxyFactory

```solidity
function initializeProxyFactory(address[] defaultAdminMembers, address[] isbeMembers, bytes32[] isbeGovernanceFacets) external
```

Initialises the proxy factory with its core administrative and governance settings.

_Sets up the initial access control for the factory contract itself. This function should
be called once upon deployment to grant the necessary administrative roles and configure
any associated governance mechanisms._

#### Parameters

| Name                 | Type      | Description                                                           |
| -------------------- | --------- | --------------------------------------------------------------------- |
| defaultAdminMembers  | address[] | The list of addresses to be granted the default admin role.           |
| isbeMembers          | address[] | The list of addresses to be granted a specific ISBE operational role. |
| isbeGovernanceFacets | bytes32[] | The encoded data for any governance facets to be configured.          |

### deployTransparent

```solidity
function deployTransparent(bytes32 businessId, struct IAccessControl.Rbac[] rbacs, bytes initData) external
```

Deploys a new transparent proxy contract with specified logic and access control.

_This function should handle the creation of a new transparent upgradeable proxy,
link it to an implementation contract (identified by `businessId`), and execute its
initialisation routine using the provided `initData`._

#### Parameters

| Name       | Type                         | Description                                                          |
| ---------- | ---------------------------- | -------------------------------------------------------------------- |
| businessId | bytes32                      | The identifier for the business logic (implementation) contract.     |
| rbacs      | struct IAccessControl.Rbac[] | An array of access control roles to configure on the new proxy.      |
| initData   | bytes                        | The encoded function call data used to initialise the proxy's state. |

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

## IProxyFactory

Interface for deploying transparent and diamond proxies with unique configurations.

_Contains functions for both single and bulk deployment of proxies using given configurations and IDs._

### TransparentDeployed

```solidity
event TransparentDeployed(bytes32 businessId, address proxy)
```

Emitted when a transparent proxy is successfully deployed.

#### Parameters

| Name       | Type    | Description                                       |
| ---------- | ------- | ------------------------------------------------- |
| businessId | bytes32 | Unique identifier of the deployed business logic. |
| proxy      | address | Address of the deployed transparent proxy.        |

### TransparentBulkDeployed

```solidity
event TransparentBulkDeployed(bytes32[] businessIds, address[] proxies)
```

Emitted when multiple transparent proxies are successfully deployed in a batch.

#### Parameters

| Name        | Type      | Description                                              |
| ----------- | --------- | -------------------------------------------------------- |
| businessIds | bytes32[] | Array of unique business logic IDs for deployed proxies. |
| proxies     | address[] | Array of addresses of the deployed transparent proxies.  |

### DiamondDeployed

```solidity
event DiamondDeployed(bytes32 configurationId, bytes32[] businessIds, uint256 version, address proxy)
```

Emitted when a diamond proxy is deployed with its configuration and business logic.

#### Parameters

| Name            | Type      | Description                                                     |
| --------------- | --------- | --------------------------------------------------------------- |
| configurationId | bytes32   | Unique identifier of the deployed diamond configuration.        |
| businessIds     | bytes32[] | Array of unique business logic IDs linked to the diamond proxy. |
| version         | uint256   | Version of the diamond configuration.                           |
| proxy           | address   | Deployed diamond proxy’s address.                               |

### deployTransparent

```solidity
function deployTransparent(bytes32 businessId, bytes initData) external
```

Deploys a single transparent proxy with its business ID and initialization data.

_The function emits the `TransparentDeployed` event on successful deployment._

#### Parameters

| Name       | Type    | Description                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| businessId | bytes32 | Unique ID of the business logic to link with the transparent proxy. |
| initData   | bytes   | Initialization data for the proxy deployment.                       |

### deployDiamond

```solidity
function deployDiamond(bytes32 configurationId, bytes32[] businessIds, bytes32 initBusinessId, bytes initData) external
```

Deploys a diamond proxy linked to multiple business logic IDs and a root initializer.

_Emits `DiamondDeployed` upon success. Initialization data is used to initialize the contract._

#### Parameters

| Name            | Type      | Description                                     |
| --------------- | --------- | ----------------------------------------------- |
| configurationId | bytes32   | Unique ID of the diamond configuration.         |
| businessIds     | bytes32[] | Array of business logic IDs for diamond facets. |
| initBusinessId  | bytes32   | The root initializer's business logic ID.       |
| initData        | bytes     | Initialization data for the deployment.         |

### deployDiamondByConfiguration

```solidity
function deployDiamondByConfiguration(bytes32 configurationId, bytes32 initBusinessId, bytes initData) external
```

Deploys a diamond proxy with configuration ID and initialization details.

_Emits the `DiamondDeployed` event upon successful deployment._

#### Parameters

| Name            | Type    | Description                                     |
| --------------- | ------- | ----------------------------------------------- |
| configurationId | bytes32 | Unique ID of the diamond configuration.         |
| initBusinessId  | bytes32 | The root initializer's business logic ID.       |
| initData        | bytes   | Initialization data for the diamond deployment. |
