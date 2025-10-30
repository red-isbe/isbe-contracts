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
function initializeERC3643Compliance(bool _maxBalanceEnabled, bool _dailyMonthLimitsEnabled) external
```

Initializes the MaxBalance feature activation.

_Can only be called once via the initializer modifier._

#### Parameters

| Name                      | Type | Description                                              |
| ------------------------- | ---- | -------------------------------------------------------- |
| \_maxBalanceEnabled       | bool | Initial value for MaxBalance feature activation.         |
| \_dailyMonthLimitsEnabled | bool | Initial value for Daily/Month Limits feature activation. |

### setMaxBalanceEnabled

```solidity
function setMaxBalanceEnabled(bool _enabled) external
```

Enables or disables the MaxBalance feature.

_Restricted to compliance role._

#### Parameters

| Name      | Type | Description                                                                        |
| --------- | ---- | ---------------------------------------------------------------------------------- |
| \_enabled | bool | True to enable, false to disable. Requirements: - Caller must have COMPLIANCE_ROLE |

### setDailyMonthLimitsEnabled

```solidity
function setDailyMonthLimitsEnabled(bool _enabled) external
```

Enables or disables the Daily/Monthly Limits feature.

_Restricted to compliance role._

#### Parameters

| Name      | Type | Description                                                                        |
| --------- | ---- | ---------------------------------------------------------------------------------- |
| \_enabled | bool | True to enable, false to disable. Requirements: - Caller must have COMPLIANCE_ROLE |

### isMaxBalanceEnabled

```solidity
function isMaxBalanceEnabled() external view returns (bool)
```

Returns true if MaxBalance feature is enabled.

#### Return Values

| Name | Type | Description                       |
| ---- | ---- | --------------------------------- |
| [0]  | bool | True if enabled, false otherwise. |

### isDailyMonthLimitsEnabled

```solidity
function isDailyMonthLimitsEnabled() external view returns (bool)
```

Returns true if Daily/Monthly Limits feature is enabled.

#### Return Values

| Name | Type | Description                       |
| ---- | ---- | --------------------------------- |
| [0]  | bool | True if enabled, false otherwise. |

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
function interfacesIntrospection() external pure returns (bytes4[] _interfaces)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name         | Type     | Description |
| ------------ | -------- | ----------- |
| \_interfaces | bytes4[] |             |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 _businessId)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| \_businessId | bytes32 |             |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] _selectors)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name        | Type     | Description |
| ----------- | -------- | ----------- |
| \_selectors | bytes4[] |             |

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
    bool dailyMonthLimitsEnabled;
}
```

### \_initialize

```solidity
function _initialize(bool _maxBalanceEnabled, bool _dailyMonthLimitsEnabled) internal
```

_Internal function to initialize MaxBalance feature activation in storage._

#### Parameters

| Name                      | Type | Description                                              |
| ------------------------- | ---- | -------------------------------------------------------- |
| \_maxBalanceEnabled       | bool | Initial value for MaxBalance feature activation.         |
| \_dailyMonthLimitsEnabled | bool | Initial value for Daily/Month Limits feature activation. |

### \_setMaxBalanceEnabled

```solidity
function _setMaxBalanceEnabled(bool _enabled) internal
```

_Internal function to activate or deactivate MaxBalance feature._

#### Parameters

| Name      | Type | Description                            |
| --------- | ---- | -------------------------------------- |
| \_enabled | bool | True to activate, false to deactivate. |

### \_setDailyMonthLimitsEnabled

```solidity
function _setDailyMonthLimitsEnabled(bool _enabled) internal
```

_Internal function to activate or deactivate Daily/Monthly Limits feature._

#### Parameters

| Name      | Type | Description                            |
| --------- | ---- | -------------------------------------- |
| \_enabled | bool | True to activate, false to deactivate. |

### \_transferred

```solidity
function _transferred(address _from, address _to, uint256 _amount) internal returns (bool)
```

_Internal hook called after tokens are transferred._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens transferred. |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | Always returns true for MaxBalance feature. |

### \_created

```solidity
function _created(address _to, uint256 _amount) internal returns (bool)
```

_Internal hook called after tokens are minted._

#### Parameters

| Name     | Type    | Description                              |
| -------- | ------- | ---------------------------------------- |
| \_to     | address | The address receiving the minted tokens. |
| \_amount | uint256 | The amount of tokens minted.             |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | Always returns true for MaxBalance feature. |

### \_destroyed

```solidity
function _destroyed(address _from, uint256 _amount) internal returns (bool)
```

_Internal hook called after tokens are burned._

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| \_from   | address | The address from which tokens are burned. |
| \_amount | uint256 | The amount of tokens burned.              |

#### Return Values

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| [0]  | bool | Always returns true for MaxBalance feature. |

### \_canTransfer

```solidity
function _canTransfer(address _from, address _to, uint256 _amount) internal view returns (bool)
```

_Internal view function to check compliance before a transfer.
Delegates to MaxBalance feature if enabled._

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

### \_isMaxBalanceEnabled

```solidity
function _isMaxBalanceEnabled() internal view returns (bool)
```

_Internal view function to check if MaxBalance feature is enabled._

#### Return Values

| Name | Type | Description                                     |
| ---- | ---- | ----------------------------------------------- |
| [0]  | bool | True if MaxBalance is enabled, false otherwise. |

### \_isDailyMonthLimitsEnabled

```solidity
function _isDailyMonthLimitsEnabled() internal view returns (bool)
```

_Internal view function to check if Daily/Monthly Limits feature is enabled._

#### Return Values

| Name | Type | Description                                                |
| ---- | ---- | ---------------------------------------------------------- |
| [0]  | bool | True if Daily/Monthly Limits are enabled, false otherwise. |

---

## ICompliance

Interface for ERC-3643 token compliance management.

_Defines lifecycle hooks and compliance checks for ERC-3643 tokens.
This interface does not handle token binding._

### ComplianceFeatureToggled

```solidity
event ComplianceFeatureToggled(string _feature, bool _enabled)
```

Emitted when a compliance feature is enabled or disabled.

#### Parameters

| Name      | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| \_feature | string | The name of the feature (e.g., "MaxBalance"). |
| \_enabled | bool   | True if enabled, false if disabled.           |

### ComplianceTransfer

```solidity
event ComplianceTransfer(address _from, address _to, uint256 _amount)
```

Emitted when tokens are transferred between wallets.

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens transferred. |

### ComplianceCreated

```solidity
event ComplianceCreated(address _to, uint256 _amount)
```

Emitted when tokens are minted to a wallet.

#### Parameters

| Name     | Type    | Description                              |
| -------- | ------- | ---------------------------------------- |
| \_to     | address | The address receiving the minted tokens. |
| \_amount | uint256 | The amount of tokens minted.             |

### ComplianceDestroyed

```solidity
event ComplianceDestroyed(address _from, uint256 _amount)
```

Emitted when tokens are burned from a wallet.

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| \_from   | address | The address from which tokens are burned. |
| \_amount | uint256 | The amount of tokens burned.              |

### initializeERC3643Compliance

```solidity
function initializeERC3643Compliance(bool _maxBalanceEnabled, bool _dailyMonthLimitsEnabled) external
```

Initializes the compliance contract with feature flags.

_Should be called once during contract setup._

#### Parameters

| Name                      | Type | Description                                  |
| ------------------------- | ---- | -------------------------------------------- |
| \_maxBalanceEnabled       | bool | Enable/disable MaxBalance feature.           |
| \_dailyMonthLimitsEnabled | bool | Enable/disable Daily/Monthly Limits feature. |

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
