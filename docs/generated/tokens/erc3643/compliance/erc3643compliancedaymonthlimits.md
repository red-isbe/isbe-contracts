## ERC3643ComplianceDMLim

External contract implementing ERC-3643 daily/monthly limits compliance feature.

_Provides public methods to update and retrieve the daily/monthly limits.
     Uses COMPLIANCE_ROLE for granular permission control._

### constructor

```solidity
constructor() internal
```

_Disables further initializations for this facet using its resolver key._

### initializeERC3643ComplianceDMLim

```solidity
function initializeERC3643ComplianceDMLim(uint256 _dailyLimit, uint256 _monthlyLimit) external
```

Initializes the daily/monthly limits.

_Can only be called once via the initializer modifier._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The initial daily transfer limit. |
| _monthlyLimit | uint256 | The initial monthly transfer limit. |

### setDailyLimit

```solidity
function setDailyLimit(uint256 _dailyLimit) external
```

Sets the daily transfer limit.

_Restricted to compliance role._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The new daily transfer limit. Requirements: - Caller must have COMPLIANCE_ROLE Emits: - {DayMonthLimitsSet} event with the new limits |

### setMonthlyLimit

```solidity
function setMonthlyLimit(uint256 _monthlyLimit) external
```

Sets the monthly transfer limit.

_Restricted to compliance role._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _monthlyLimit | uint256 | The new monthly transfer limit. Requirements: - Caller must have COMPLIANCE_ROLE Emits: - {DayMonthLimitsSet} event with the new limits |

### dailyLimit

```solidity
function dailyLimit() external view returns (uint256 _dailyLimit)
```

Returns the current daily transfer limit.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The daily transfer limit. |

### monthlyLimit

```solidity
function monthlyLimit() external view returns (uint256 _monthlyLimit)
```

Returns the current monthly transfer limit.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _monthlyLimit | uint256 | The monthly transfer limit. |

### complianceCheckOnDayMonthLimits

```solidity
function complianceCheckOnDayMonthLimits(address _from, uint256 _amount) external view returns (bool _isCompliant)
```

Checks if a transfer respects the daily/monthly limits.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | The address of the sender. |
| _amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isCompliant | bool | True if compliant, false otherwise. |

### _implementedInterfaces

```solidity
function _implementedInterfaces() internal pure virtual returns (bytes4[] interfaces_)
```

_Declares the interfaces implemented by this facet._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | Array of supported interface identifiers. |



---

## ERC3643ComplianceDMLimFacet

Facet contract exposing ERC-3643 daily/monthly limits compliance feature and EIP-2535 introspection.

_Inherits ERC3643ComplianceDMLim and implements IEIP2535Introspection for Diamond compatibility._

### interfacesIntrospection

```solidity
function interfacesIntrospection() external pure returns (bytes4[] interfaces_)
```

Gets the list of ERC-165 interface IDs the facet supports.

_A pure function that returns an array of supported `bytes4` IDs._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaces_ | bytes4[] | An array of supported interface identifiers. |

### businessIdIntrospection

```solidity
function businessIdIntrospection() external pure returns (bytes32 businessId_)
```

Retrieves the unique business identifier for this facet.

_Returns a `bytes32` key identifying the facet's purpose._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| businessId_ | bytes32 | The `bytes32` ID for the business logic. |

### selectorsIntrospection

```solidity
function selectorsIntrospection() external pure returns (bytes4[] selectors_)
```

Gets all function selectors implemented by this facet.

_A pure function that returns a `bytes4[]` array of selectors._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| selectors_ | bytes4[] | An array of `bytes4` function selectors. |



---

## ERC3643ComplianceDMLimInternal

Internal contract for managing ERC-3643 daily/monthly transfer limits.

_Provides internal functions to read and write limit fields, check compliance, and update counters.
     This contract does not emit events or apply access control.
     It is intended to be used by external contracts that handle authorization and event emission._

### ERC3643ComplianceDMLimStorage

_Storage structure for ERC-3643 daily/monthly limits._

```solidity
struct ERC3643ComplianceDMLimStorage {
  uint256 dailyLimit;
  uint256 monthlyLimit;
  mapping(address => struct ERC3643ComplianceDMLimInternal.TransferCounter) usersCounters;
}
```

### TransferCounter

_Struct of transfer counters for each address._

```solidity
struct TransferCounter {
  uint256 dailyCount;
  uint256 monthlyCount;
  uint256 dailyTimer;
  uint256 monthlyTimer;
}
```

### _initializeDMLim

```solidity
function _initializeDMLim(uint256 _dailyLimit, uint256 _monthlyLimit) internal
```

_Internal function to initialize daily/monthly limits in storage.
Sets the initial values for daily and monthly transfer limits._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The initial daily transfer limit. |
| _monthlyLimit | uint256 | The initial monthly transfer limit. |

### _setDailyLimit

```solidity
function _setDailyLimit(uint256 _dailyLimit) internal
```

_Internal function to update the daily limit value in storage._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The new daily limit value to assign. |

### _setMonthlyLimit

```solidity
function _setMonthlyLimit(uint256 _monthlyLimit) internal
```

_Internal function to update the monthly limit value in storage._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _monthlyLimit | uint256 | The new monthly limit value to assign. |

### _transferActionOnDayMonthLimits

```solidity
function _transferActionOnDayMonthLimits(address _from, uint256 _amount) internal
```

_Internal hook for post-transfer operations for DayMonthLimits feature.
     Updates daily and monthly counters.
     Emits DayMonthLimitsTransferHook event._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | The address of the sender. |
| _amount | uint256 | The amount of tokens transferred. |

### _getDailyLimit

```solidity
function _getDailyLimit() internal view returns (uint256)
```

_Internal view function to retrieve the current daily limit value from storage._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current daily limit value. |

### _getMonthlyLimit

```solidity
function _getMonthlyLimit() internal view returns (uint256)
```

_Internal view function to retrieve the current monthly limit value from storage._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The current monthly limit value. |

### _getTransferCounter

```solidity
function _getTransferCounter(address _account) internal view returns (struct ERC3643ComplianceDMLimInternal.TransferCounter counter)
```

_Internal view function to get the transfer counters for a given address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The address to query. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| counter | struct ERC3643ComplianceDMLimInternal.TransferCounter | The TransferCounter struct for the address. |

### _complianceCheckOnDayMonthLimits

```solidity
function _complianceCheckOnDayMonthLimits(address _from, uint256 _value) internal view returns (bool)
```

_Internal view function to check if a transfer respects the daily/monthly limits._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | The address of the sender. |
| _value | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if compliant, false otherwise. |

### _isDayFinished

```solidity
function _isDayFinished(address _account) internal view returns (bool)
```

_Internal view function to check if the day has finished for an address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The address to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the day has finished, false otherwise. |

### _isMonthFinished

```solidity
function _isMonthFinished(address _account) internal view returns (bool)
```

_Internal view function to check if the month has finished for an address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _account | address | The address to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the month has finished, false otherwise. |



---

## IERC3643ComplianceDMLim

Interface for ERC-3643 compliance feature: Daily/Month transfer limits.

_Allows setting limits, checking compliance, and lifecycle hooks for transfers, minting, and burning._

### DayMonthLimitsTransferHook

```solidity
event DayMonthLimitsTransferHook(address from, uint256 amount)
```

Emitted when a transfer is checked against the daily/monthly limits restriction.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address sending tokens. |
| amount | uint256 | The amount of tokens being transferred. |

### DayMonthLimitsCreationHook

```solidity
event DayMonthLimitsCreationHook(address to, uint256 amount)
```

Emitted when tokens are created and checked against the daily/monthly limits restriction.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address receiving the newly created tokens. |
| amount | uint256 | The amount of tokens created. |

### DayMonthLimitsDestructionHook

```solidity
event DayMonthLimitsDestructionHook(address from, uint256 amount)
```

Emitted when tokens are destroyed and checked against the daily/monthly limits restriction.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address from which tokens are destroyed. |
| amount | uint256 | The amount of tokens destroyed. |

### DayMonthLimitsSet

```solidity
event DayMonthLimitsSet(uint256 _dailyLimit, uint256 _monthlyLimit)
```

Emitted when daily or monthly limits are updated.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The new daily transfer limit. |
| _monthlyLimit | uint256 | The new monthly transfer limit. |

### initializeERC3643ComplianceDMLim

```solidity
function initializeERC3643ComplianceDMLim(uint256 _dailyLimit, uint256 _monthlyLimit) external
```

Initializes the daily/monthly limits.

_Should be called once during contract setup._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The initial daily transfer limit. |
| _monthlyLimit | uint256 | The initial monthly transfer limit. |

### setDailyLimit

```solidity
function setDailyLimit(uint256 _dailyLimit) external
```

Sets the daily transfer limit.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The new daily transfer limit. |

### setMonthlyLimit

```solidity
function setMonthlyLimit(uint256 _monthlyLimit) external
```

Sets the monthly transfer limit.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _monthlyLimit | uint256 | The new monthly transfer limit. |

### dailyLimit

```solidity
function dailyLimit() external view returns (uint256 _dailyLimit)
```

Returns the current daily transfer limit.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dailyLimit | uint256 | The daily transfer limit. |

### monthlyLimit

```solidity
function monthlyLimit() external view returns (uint256 _monthlyLimit)
```

Returns the current monthly transfer limit.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _monthlyLimit | uint256 | The monthly transfer limit. |

### complianceCheckOnDayMonthLimits

```solidity
function complianceCheckOnDayMonthLimits(address _from, uint256 _amount) external view returns (bool _isCompliant)
```

Checks if a transfer respects the daily/monthly limits.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _from | address | The address of the sender. |
| _amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isCompliant | bool | True if compliant, false otherwise. |

