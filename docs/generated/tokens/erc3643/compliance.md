## ERC3643Compliance

External contract implementing ERC-3643 compliance management (MaxBalance only).

_Provides public methods to activate/deactivate MaxBalance and check compliance.
Uses COMPLIANCE_ROLE for granular permission control._

### constructor

```solidity
constructor() internal
```

_Disables further initializations for this facet using its resolver key._

### initializeERC3643Compliance

```solidity
function initializeERC3643Compliance(bool maxBalanceEnabled) external
```

Initializes the MaxBalance feature activation.

_Can only be called once via the initializer modifier._

#### Parameters

| Name              | Type | Description                                      |
| ----------------- | ---- | ------------------------------------------------ |
| maxBalanceEnabled | bool | Initial value for MaxBalance feature activation. |

### setMaxBalanceEnabled

```solidity
function setMaxBalanceEnabled(bool enabled) external
```

Enables or disables the MaxBalance feature.

_Restricted to compliance role._

#### Parameters

| Name    | Type | Description                                                                        |
| ------- | ---- | ---------------------------------------------------------------------------------- |
| enabled | bool | True to enable, false to disable. Requirements: - Caller must have COMPLIANCE_ROLE |

### isMaxBalanceEnabled

```solidity
function isMaxBalanceEnabled() external view returns (bool)
```

Returns true if MaxBalance feature is enabled.

#### Return Values

| Name | Type | Description                       |
| ---- | ---- | --------------------------------- |
| [0]  | bool | True if enabled, false otherwise. |

### transferred

```solidity
function transferred(address _from, address _to, uint256 _amount) external
```

Called after tokens are transferred.

_Implements ICompliance. Delegates to internal logic._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens transferred. |

### created

```solidity
function created(address _to, uint256 _amount) external
```

Called after tokens are minted.

_Implements ICompliance. Delegates to internal logic._

#### Parameters

| Name     | Type    | Description                              |
| -------- | ------- | ---------------------------------------- |
| \_to     | address | The address receiving the minted tokens. |
| \_amount | uint256 | The amount of tokens minted.             |

### destroyed

```solidity
function destroyed(address _from, uint256 _amount) external
```

Called after tokens are burned.

_Implements ICompliance. Delegates to internal logic._

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| \_from   | address | The address from which tokens are burned. |
| \_amount | uint256 | The amount of tokens burned.              |

### canTransfer

```solidity
function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool)
```

Checks if a transfer is compliant.

_Implements ICompliance. Delegates to internal logic._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description                                         |
| ---- | ---- | --------------------------------------------------- |
| [0]  | bool | True if the transfer is compliant, false otherwise. |

### \_implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Declares the interfaces implemented by this facet._

#### Return Values

| Name         | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| interfaces\_ | bytes4[] | Array of supported interface identifiers. |

---

## ERC3643ComplianceFacet

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

## ERC3643ComplianceInternal

Internal contract for managing ERC-3643 MaxBalance compliance feature.

_Provides internal functions to activate/deactivate MaxBalance and check compliance.
This contract does not emit events or apply access control.
It is intended to be used by external contracts that handle authorization and event emission._

### ERC3643ComplianceStorage

_Storage structure for ERC-3643 MaxBalance feature activation._

```solidity
struct ERC3643ComplianceStorage {
    bool maxBalanceEnabled;
}
```

### \_initialize

```solidity
function _initialize(bool _maxBalanceEnabled) internal
```

_Internal function to initialize MaxBalance feature activation in storage._

#### Parameters

| Name                | Type | Description                                      |
| ------------------- | ---- | ------------------------------------------------ |
| \_maxBalanceEnabled | bool | Initial value for MaxBalance feature activation. |

### \_setMaxBalanceEnabled

```solidity
function _setMaxBalanceEnabled(bool enabled) internal
```

_Internal function to activate or deactivate MaxBalance feature._

#### Parameters

| Name    | Type | Description                            |
| ------- | ---- | -------------------------------------- |
| enabled | bool | True to activate, false to deactivate. |

### \_isMaxBalanceEnabled

```solidity
function _isMaxBalanceEnabled() internal view returns (bool)
```

_Internal view function to check if MaxBalance feature is enabled._

#### Return Values

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| [0]  | bool | True if MaxBalance is enabled, false otherwise. |

### \_canTransfer

```solidity
function _canTransfer(address from, address to, uint256 amount) internal view returns (bool)
```

_Internal view function to check compliance before a transfer.
Delegates to MaxBalance feature if enabled._

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| from   | address | The address of the sender.        |
| to     | address | The address of the receiver.      |
| amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description                                         |
| ---- | ---- | --------------------------------------------------- |
| [0]  | bool | True if the transfer is compliant, false otherwise. |

### \_transferred

```solidity
function _transferred(address from, address to, uint256 amount) internal pure returns (bool)
```

_Internal hook called after tokens are transferred._

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| from   | address | The address of the sender.        |
| to     | address | The address of the receiver.      |
| amount | uint256 | The amount of tokens transferred. |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | Always returns true for MaxBalance feature. |

### \_created

```solidity
function _created(address to, uint256 amount) internal pure returns (bool)
```

_Internal hook called after tokens are minted._

#### Parameters

| Name   | Type    | Description                              |
| ------ | ------- | ---------------------------------------- |
| to     | address | The address receiving the minted tokens. |
| amount | uint256 | The amount of tokens minted.             |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | Always returns true for MaxBalance feature. |

### \_destroyed

```solidity
function _destroyed(address from, uint256 amount) internal view returns (bool)
```

_Internal hook called after tokens are burned._

#### Parameters

| Name   | Type    | Description                               |
| ------ | ------- | ----------------------------------------- |
| from   | address | The address from which tokens are burned. |
| amount | uint256 | The amount of tokens burned.              |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | Always returns true for MaxBalance feature. |

---

## ICompliance

Interface for ERC-3643 token compliance management.

_Defines lifecycle hooks and compliance checks for ERC-3643 tokens.
This interface does not handle token binding._

### ComplianceFeatureToggled

```solidity
event ComplianceFeatureToggled(string feature, bool enabled)
```

Emitted when a compliance feature is enabled or disabled.

#### Parameters

| Name    | Type   | Description                                   |
| ------- | ------ | --------------------------------------------- |
| feature | string | The name of the feature (e.g., "MaxBalance"). |
| enabled | bool   | True if enabled, false if disabled.           |

### transferred

```solidity
function transferred(address _from, address _to, uint256 _amount) external
```

Called whenever tokens are transferred between wallets.

_Can be used to update state variables of the compliance contract.
Should only be called by the token contract._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens transferred. |

### created

```solidity
function created(address _to, uint256 _amount) external
```

Called whenever tokens are minted to a wallet.

_Can be used to update state variables of the compliance contract.
Should only be called by the token contract._

#### Parameters

| Name     | Type    | Description                              |
| -------- | ------- | ---------------------------------------- |
| \_to     | address | The address receiving the minted tokens. |
| \_amount | uint256 | The amount of tokens minted.             |

### destroyed

```solidity
function destroyed(address _from, uint256 _amount) external
```

Called whenever tokens are burned from a wallet.

_Can be used to update state variables of the compliance contract.
Should only be called by the token contract._

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| \_from   | address | The address from which tokens are burned. |
| \_amount | uint256 | The amount of tokens burned.              |

### initializeERC3643Compliance

```solidity
function initializeERC3643Compliance(bool _maxBalanceEnabled) external
```

Initializes the compliance contract with feature flags.

_Should be called once during contract setup._

#### Parameters

| Name                | Type | Description                        |
| ------------------- | ---- | ---------------------------------- |
| \_maxBalanceEnabled | bool | Enable/disable MaxBalance feature. |

### canTransfer

```solidity
function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool)
```

Checks if a transfer is compliant.

_Read-only function. Does not modify state or emit events.
Returns true if all compliance checks pass, false otherwise._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description                                         |
| ---- | ---- | --------------------------------------------------- |
| [0]  | bool | True if the transfer is compliant, false otherwise. |
