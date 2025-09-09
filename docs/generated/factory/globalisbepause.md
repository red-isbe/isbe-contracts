## GlobalIsbePause

Provides the public implementation for the global pausing mechanism.

_This abstract contract implements the `IGlobalIsbePause` interface.
It secures the pause and unpause functions with role-based access
control, ensuring only authorised accounts (`_ISBE_PAUSER_ROLE`)
can manage the state of registered proxies._

### pauseIsbe

```solidity
function pauseIsbe(address _proxyAddress) external
```

Pauses a specific use-case proxy contract.

_This can only be called by an account with the appropriate role._

#### Parameters

| Name           | Type    | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| \_proxyAddress | address | The address of the proxy contract to pause. |

### unpauseIsbe

```solidity
function unpauseIsbe(address _proxyAddress) external
```

Unpauses a specific use-case proxy contract.

_This can only be called by an account with the appropriate role._

#### Parameters

| Name           | Type    | Description                                   |
| -------------- | ------- | --------------------------------------------- |
| \_proxyAddress | address | The address of the proxy contract to unpause. |

---

## GlobalIsbePauseFacet

An EIP-2535 facet for the global ISBE pausing mechanism. This
contract exposes pause and unpause functions for use-case proxies.

_Inherits from `GlobalIsbePause` and implements the standard
EIP-2535 introspection interface. The initialiser is disabled
to ensure it can only be deployed as a facet in a proxy's context._

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

## GlobalIsbePauseInternal

Abstract contract with the internal logic for global pausing.

_Provides core functions for pausing and unpausing any deployed proxy.
It relies on `ProxyFactoryInternal` to verify that a given address
is a valid proxy before applying changes. It also implements the
`IEIP2535Introspection` interface for discovery purposes._

### onlyDeployedProxy

```solidity
modifier onlyDeployedProxy(address _proxyAddress)
```

Ensures the function is called for a deployed proxy.

_Reverts if `proxyAddress` is not a known, deployed proxy address._

#### Parameters

| Name           | Type    | Description                             |
| -------------- | ------- | --------------------------------------- |
| \_proxyAddress | address | The address of the proxy to be checked. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure returns (bytes4[] interfaces_)
```

---

## IGlobalIsbePause

Defines a global pausing mechanism for ISBE use-case proxies.

_Allows an authorised role to centrally pause and unpause any proxy
contract registered within the ISBE ecosystem._

### IsbePaused

```solidity
event IsbePaused(address proxyAddress, address account)
```

Emitted when a use-case proxy is paused by the ISBE governance.

#### Parameters

| Name         | Type    | Description                                    |
| ------------ | ------- | ---------------------------------------------- |
| proxyAddress | address | The address of the proxy that has been paused. |
| account      | address | The address that triggered the pause           |

### IsbeUnpaused

```solidity
event IsbeUnpaused(address proxyAddress, address account)
```

Emitted when a use-case proxy is unpaused by the ISBE governance.

#### Parameters

| Name         | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| proxyAddress | address | The address of the proxy that has been unpaused. |
| account      | address | The address that triggered the pause             |

### InvalidProxy

```solidity
error InvalidProxy(address proxyAddress)
```

Reverted if the target address is not a valid or known proxy.

#### Parameters

| Name         | Type    | Description                                          |
| ------------ | ------- | ---------------------------------------------------- |
| proxyAddress | address | The address that was identified as an invalid proxy. |

### pauseIsbe

```solidity
function pauseIsbe(address _proxyAddress) external
```

Pauses a specific use-case proxy contract.

_This can only be called by an account with the appropriate role._

#### Parameters

| Name           | Type    | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| \_proxyAddress | address | The address of the proxy contract to pause. |

### unpauseIsbe

```solidity
function unpauseIsbe(address _proxyAddress) external
```

Unpauses a specific use-case proxy contract.

_This can only be called by an account with the appropriate role._

#### Parameters

| Name           | Type    | Description                                   |
| -------------- | ------- | --------------------------------------------- |
| \_proxyAddress | address | The address of the proxy contract to unpause. |
