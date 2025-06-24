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
