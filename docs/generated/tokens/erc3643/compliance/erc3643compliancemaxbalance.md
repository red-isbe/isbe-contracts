## ERC3643ComplianceMaxBal

External contract implementing ERC-3643 MaxBalance compliance feature.

_Provides public methods to update and retrieve the max balance restriction.
Uses COMPLIANCE_ROLE for granular permission control._

### constructor

```solidity
constructor() internal
```

_Disables further initializations for this facet using its resolver key._

### initializeERC3643ComplianceMaxBalance

```solidity
function initializeERC3643ComplianceMaxBalance(uint256 _maxBalance) external
```

Initializes the max balance restriction.

_Can only be called once via the initializer modifier._

#### Parameters

| Name         | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| \_maxBalance | uint256 | The initial max balance value. |

### setMaxBalance

```solidity
function setMaxBalance(uint256 _maxBalance) external
```

Updates the max balance restriction.

_Restricted to compliance role._

#### Parameters

| Name         | Type    | Description                                                                                                                               |
| ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| \_maxBalance | uint256 | The new max balance value. Requirements: - Caller must have COMPLIANCE_ROLE Emits: - {MaxBalanceSet} event with the new max balance value |

### maxBalance

```solidity
function maxBalance() external view returns (uint256 _maxBalance)
```

Returns the current max balance restriction.

#### Return Values

| Name         | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| \_maxBalance | uint256 | The current max balance value. |

### complianceCheckOnMaxBalance

```solidity
function complianceCheckOnMaxBalance(address _to, uint256 _amount) external view returns (bool _isCompliant)
```

Checks if a transfer respects the max balance restriction.

_Uses ERC20Internal balance primitive for the receiver._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name          | Type | Description                         |
| ------------- | ---- | ----------------------------------- |
| \_isCompliant | bool | True if compliant, false otherwise. |

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

## ERC3643ComplianceMaxBalInternal

Internal contract for managing ERC-3643 MaxBalance restriction.

_Provides internal functions to read and write the max balance field and check compliance for transfers.
This contract does not emit events or apply access control.
Balances are read directly from ERC20Internal primitives.
It is intended to be used by external contracts that handle authorization and event emission._

### ERC3643ComplianceMaxBalanceStorage

_Storage structure for ERC-3643 MaxBalance restriction._

```solidity
struct ERC3643ComplianceMaxBalanceStorage {
    uint256 maxBalance;
}
```

### \_initializeMaxBalance

```solidity
function _initializeMaxBalance(uint256 _maxBalance) internal
```

_Internal function to initialize the max balance restriction in storage.
Sets the initial value for the max balance._

#### Parameters

| Name         | Type    | Description                              |
| ------------ | ------- | ---------------------------------------- |
| \_maxBalance | uint256 | The initial max balance value to assign. |

### \_setMaxBalance

```solidity
function _setMaxBalance(uint256 _maxBalance) internal
```

_Internal function to update the max balance value in storage._

#### Parameters

| Name         | Type    | Description                          |
| ------------ | ------- | ------------------------------------ |
| \_maxBalance | uint256 | The new max balance value to assign. |

### \_transferActionOnMaxBalance

```solidity
function _transferActionOnMaxBalance(address _from, address _to, uint256 _amount) internal
```

_Internal hook for post-transfer operations for MaxBalance feature.
Intentionally left empty for feature mapping._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_from   | address | The address of the sender.        |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens transferred. |

### \_creationActionOnMaxBalance

```solidity
function _creationActionOnMaxBalance(address _to, uint256 _amount) internal
```

_Internal hook for post-mint operations for MaxBalance feature.
Intentionally left empty for feature mapping._

#### Parameters

| Name     | Type    | Description                          |
| -------- | ------- | ------------------------------------ |
| \_to     | address | The address receiving minted tokens. |
| \_amount | uint256 | The amount of tokens minted.         |

### \_destructionActionOnMaxBalance

```solidity
function _destructionActionOnMaxBalance(address _from, uint256 _amount) internal
```

_Internal hook for post-burn operations for MaxBalance feature.
Intentionally left empty for feature mapping._

#### Parameters

| Name     | Type    | Description                               |
| -------- | ------- | ----------------------------------------- |
| \_from   | address | The address from which tokens are burned. |
| \_amount | uint256 | The amount of tokens burned.              |

### \_getMaxBalance

```solidity
function _getMaxBalance() internal view returns (uint256)
```

_Internal view function to retrieve the current max balance value from storage._

#### Return Values

| Name | Type    | Description                    |
| ---- | ------- | ------------------------------ |
| [0]  | uint256 | The current max balance value. |

### \_complianceCheckOnMaxBalance

```solidity
function _complianceCheckOnMaxBalance(address _to, uint256 _amount) internal view returns (bool)
```

_Internal view function to check if a transfer respects the max balance restriction.
Uses ERC20Internal balance primitive for the receiver._

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description                         |
| ---- | ---- | ----------------------------------- |
| [0]  | bool | True if compliant, false otherwise. |

---

## IERC3643ComplianceMaxBal

Interface for ERC-3643 compliance feature: MaxBalance restriction.

_Allows setting and getting the max balance, and checking compliance for transfers._

### MaxBalanceSet

```solidity
event MaxBalanceSet(uint256 _maxBalance)
```

Emitted when the max balance is updated.

#### Parameters

| Name         | Type    | Description                |
| ------------ | ------- | -------------------------- |
| \_maxBalance | uint256 | The new max balance value. |

### initializeERC3643ComplianceMaxBalance

```solidity
function initializeERC3643ComplianceMaxBalance(uint256 _maxBalance) external
```

Initializes the max balance restriction.

_Can only be called once via the initializer modifier._

#### Parameters

| Name         | Type    | Description                    |
| ------------ | ------- | ------------------------------ |
| \_maxBalance | uint256 | The initial max balance value. |

### setMaxBalance

```solidity
function setMaxBalance(uint256 _maxBalance) external
```

Sets the maximum balance allowed per address.

#### Parameters

| Name         | Type    | Description                                       |
| ------------ | ------- | ------------------------------------------------- |
| \_maxBalance | uint256 | The maximum amount of tokens an address can hold. |

### maxBalance

```solidity
function maxBalance() external view returns (uint256 _maxBalance)
```

Returns the current maximum balance allowed per address.

#### Return Values

| Name         | Type    | Description                |
| ------------ | ------- | -------------------------- |
| \_maxBalance | uint256 | The maximum balance value. |

### complianceCheckOnMaxBalance

```solidity
function complianceCheckOnMaxBalance(address _to, uint256 _amount) external view returns (bool _isCompliant)
```

Checks if a transfer respects the max balance restriction.

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_to     | address | The address of the receiver.      |
| \_amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name          | Type | Description                         |
| ------------- | ---- | ----------------------------------- |
| \_isCompliant | bool | True if compliant, false otherwise. |
