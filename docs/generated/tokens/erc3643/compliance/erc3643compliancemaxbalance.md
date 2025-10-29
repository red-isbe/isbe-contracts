## ERC3643ComplianceMaxBalanceInternal

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
function _transferActionOnMaxBalance(address from, address to, uint256 amount) internal
```

_Internal hook for post-transfer operations for MaxBalance feature.
Intentionally left empty for feature mapping._

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| from   | address | The address of the sender.        |
| to     | address | The address of the receiver.      |
| amount | uint256 | The amount of tokens transferred. |

### \_creationActionOnMaxBalance

```solidity
function _creationActionOnMaxBalance(address to, uint256 amount) internal
```

_Internal hook for post-mint operations for MaxBalance feature.
Intentionally left empty for feature mapping._

#### Parameters

| Name   | Type    | Description                          |
| ------ | ------- | ------------------------------------ |
| to     | address | The address receiving minted tokens. |
| amount | uint256 | The amount of tokens minted.         |

### \_destructionActionOnMaxBalance

```solidity
function _destructionActionOnMaxBalance(address from, uint256 amount) internal
```

_Internal hook for post-burn operations for MaxBalance feature.
Intentionally left empty for feature mapping._

#### Parameters

| Name   | Type    | Description                               |
| ------ | ------- | ----------------------------------------- |
| from   | address | The address from which tokens are burned. |
| amount | uint256 | The amount of tokens burned.              |

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
function _complianceCheckOnMaxBalance(address to, uint256 amount) internal view returns (bool)
```

_Internal view function to check if a transfer respects the max balance restriction.
Uses ERC20Internal balance primitive for the receiver._

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| to     | address | The address of the receiver.      |
| amount | uint256 | The amount of tokens to transfer. |

#### Return Values

| Name | Type | Description                         |
| ---- | ---- | ----------------------------------- |
| [0]  | bool | True if compliant, false otherwise. |
