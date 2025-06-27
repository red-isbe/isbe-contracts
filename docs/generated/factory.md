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

## IIsbeFactory

A comprehensive factory interface that unifies business logic and proxy deployment.

_This interface consolidates the `IBusinessLogicFactory` and `IProxyFactory` interfaces,
providing a single point of entry for all contract deployment and management operations
within the ISBE ecosystem. It inherits all functions, events, and errors from its
parent interfaces and does not introduce any new elements. For implementation details,
please refer to the `IBusinessLogicFactory` and `IProxyFactory` documentation._
